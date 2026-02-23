import { supabase } from '../lib/supabase';

function mapMessage(row) {
  return {
    id: row.id,
    tradeRequestId: row.trade_request_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
    sender: row.sender
      ? {
          id: row.sender.id,
          name: row.sender.name,
          picture: row.sender.picture,
        }
      : null,
  };
}

export const tradeChatService = {
  /** Get all messages for an accepted trade (chronological) */
  async getMessages(tradeRequestId) {
    const { data, error } = await supabase
      .from('trade_chat_messages')
      .select(
        `
        id,
        trade_request_id,
        sender_id,
        content,
        created_at,
        sender:users(id, name, picture)
      `
      )
      .eq('trade_request_id', tradeRequestId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(mapMessage);
  },

  /** Send a message (caller must be requester or skill owner; trade must be accepted) */
  async sendMessage(tradeRequestId, content) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to send messages');

    const trimmed = (content || '').trim();
    if (!trimmed) throw new Error('Message cannot be empty');
    if (trimmed.length > 2000) throw new Error('Message is too long (max 2000 characters)');

    const { data, error } = await supabase
      .from('trade_chat_messages')
      .insert({
        trade_request_id: tradeRequestId,
        sender_id: user.id,
        content: trimmed,
      })
      .select(
        `
        id,
        trade_request_id,
        sender_id,
        content,
        created_at,
        sender:users(id, name, picture)
      `
      )
      .single();

    if (error) throw new Error(error.message);
    return mapMessage(data);
  },

  /** Subscribe to new messages for a trade (realtime). Returns unsubscribe function. */
  subscribeToMessages(tradeRequestId, onMessage) {
    const channel = supabase
      .channel(`trade_chat:${tradeRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_chat_messages',
          filter: `trade_request_id=eq.${tradeRequestId}`,
        },
        (payload) => {
          const row = payload.new;
          supabase
            .from('trade_chat_messages')
            .select(
              `
              id,
              trade_request_id,
              sender_id,
              content,
              created_at,
              sender:users(id, name, picture)
            `
            )
            .eq('id', row.id)
            .single()
            .then(({ data }) => {
              if (data) onMessage(mapMessage(data));
            })
            .catch(() => {
              onMessage({
                id: row.id,
                tradeRequestId: row.trade_request_id,
                senderId: row.sender_id,
                content: row.content,
                createdAt: row.created_at,
                sender: null,
              });
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
