import { supabase } from '../lib/supabase';

export const skillsService = {
  // Get all skills with filters
  async getSkills(filters = {}) {
    let query = supabase
      .from('skills')
      .select(`
        *,
        user:users(id, name, email, picture, university, location)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }

    if (filters.type && filters.type !== 'All') {
      query = query.eq('type', filters.type);
    }

    // Apply search
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Transform data to match frontend format
    return data.map((skill) => ({
      id: skill.id,
      title: skill.title,
      description: skill.description,
      category: skill.category,
      type: skill.type,
      location: skill.location,
      user: skill.user?.name || 'Unknown',
      user_id: skill.user_id,
      userData: skill.user,
      createdAt: skill.created_at,
    }));
  },

  // Get user profile and their active skills (for profile modal)
  async getProfile(userId) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, picture, university, location, bio')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    const { data: userSkills, error: skillsError } = await supabase
      .from('skills')
      .select('id, title, description, category, type, location, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (skillsError) throw new Error(skillsError.message);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        university: user.university,
        location: user.location,
        bio: user.bio || '',
      },
      skills: (userSkills || []).map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        type: s.type,
        location: s.location,
        createdAt: s.created_at,
      })),
    };
  },

  // Get single skill
  async getSkill(id) {
    const { data, error } = await supabase
      .from('skills')
      .select(`
        *,
        user:users(id, name, email, picture, university, location)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      location: data.location,
      user: data.user?.name || 'Unknown',
      user_id: data.user_id,
      userData: data.user,
      createdAt: data.created_at,
    };
  },

  // Create skill
  async createSkill(skillData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to create a skill');
    }

    const { data, error } = await supabase
      .from('skills')
      .insert({
        title: skillData.title,
        description: skillData.description,
        category: skillData.category,
        type: skillData.type,
        location: skillData.location || '',
        user_id: user.id,
        status: 'active',
      })
      .select(`
        *,
        user:users(id, name, email, picture, university, location)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      location: data.location,
      user: data.user?.name || 'Unknown',
      user_id: data.user_id,
      userData: data.user,
      createdAt: data.created_at,
    };
  },

  // Update skill
  async updateSkill(id, updates) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to update a skill');
    }

    // Check ownership
    const { data: skill } = await supabase
      .from('skills')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!skill) {
      throw new Error('Skill not found');
    }

    if (skill.user_id !== user.id) {
      throw new Error('You can only update your own skills');
    }

    const { data, error } = await supabase
      .from('skills')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:users(id, name, email, picture, university, location)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      type: data.type,
      location: data.location,
      user: data.user?.name || 'Unknown',
      user_id: data.user_id,
      userData: data.user,
      createdAt: data.created_at,
    };
  },

  // Delete skill
  async deleteSkill(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be logged in to delete a skill');
    }

    // Check ownership
    const { data: skill } = await supabase
      .from('skills')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!skill) {
      throw new Error('Skill not found');
    }

    if (skill.user_id !== user.id) {
      throw new Error('You can only delete your own skills');
    }

    const { error } = await supabase.from('skills').delete().eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Request trade (creates a trade_requests row via tradesService)
  async requestTrade(skillId, message = '') {
    const { tradesService } = await import('./tradesService');
    return tradesService.create(skillId, message);
  },

  /** Update current user profile (university, location, bio) */
  async updateProfile(updates) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to update your profile');

    const { error } = await supabase
      .from('users')
      .update({
        ...(updates.university !== undefined && { university: updates.university }),
        ...(updates.location !== undefined && { location: updates.location }),
        ...(updates.bio !== undefined && { bio: updates.bio }),
      })
      .eq('id', user.id);

    if (error) throw new Error(error.message);
  },

  // Get my skills (for dashboard)
  async getMySkills() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in');

    const { data, error } = await supabase
      .from('skills')
      .select(
        `*,
        user:users(id, name, email, picture, university, location)`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((skill) => ({
      id: skill.id,
      title: skill.title,
      description: skill.description,
      category: skill.category,
      type: skill.type,
      location: skill.location,
      status: skill.status,
      user: skill.user?.name || 'Unknown',
      user_id: skill.user_id,
      userData: skill.user,
      createdAt: skill.created_at,
    }));
  },
};
