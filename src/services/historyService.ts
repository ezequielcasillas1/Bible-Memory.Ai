import { supabase } from '../lib/supabase';
import { MemorizationHistory, MemorizationSession } from '../types';

export interface HistoryEntry {
  id: string;
  user_id: string;
  verse_text: string;
  verse_reference: string;
  verse_testament: 'OT' | 'NT';
  attempts: number;
  best_accuracy: number;
  average_accuracy: number;
  total_time: number;
  last_practiced: string;
  status: 'learning' | 'reviewing' | 'mastered';
  created_at: string;
  updated_at: string;
}

export class HistoryService {
  static async saveMemorizationResult(
    session: MemorizationSession,
    accuracy: number,
    practiceTime: number,
    userInput?: string,
    comparisonResult?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user, cannot save history');
        return;
      }

      console.log('Saving memorization result to Supabase:', {
        verse: session.verse.reference,
        accuracy,
        practiceTime
      });

      // Check if this verse already exists in history
      const { data: existingHistory, error: fetchError } = await supabase
        .from('memorization_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('verse_reference', session.verse.reference)
        .limit(1);

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingHistory && existingHistory.length > 0) {
        const existing = existingHistory[0];
        // Update existing entry
        const newAttempts = existing.attempts + 1;
        const newAverageAccuracy = ((existing.average_accuracy * existing.attempts) + accuracy) / newAttempts;
        const newStatus = accuracy >= 95 ? 'mastered' : accuracy >= 80 ? 'reviewing' : 'learning';

        const { error: updateError } = await supabase
          .from('memorization_history')
          .update({
            attempts: newAttempts,
            best_accuracy: Math.max(existing.best_accuracy, accuracy),
            average_accuracy: newAverageAccuracy,
            total_time: existing.total_time + practiceTime,
            last_practiced: new Date().toISOString(),
            status: newStatus,
            user_input: userInput,
            comparison_result: comparisonResult
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        console.log('Updated existing history entry for:', session.verse.reference);
      } else {
        // Create new entry
        const newStatus = accuracy >= 95 ? 'mastered' : accuracy >= 80 ? 'reviewing' : 'learning';

        const { error: insertError } = await supabase
          .from('memorization_history')
          .insert({
            user_id: user.id,
            verse_text: session.verse.text,
            verse_reference: session.verse.reference,
            verse_testament: session.verse.testament,
            attempts: 1,
            best_accuracy: accuracy,
            average_accuracy: accuracy,
            total_time: practiceTime,
            last_practiced: new Date().toISOString(),
            status: newStatus,
            user_input: userInput,
            comparison_result: comparisonResult
          });

        if (insertError) throw insertError;
        console.log('Created new history entry for:', session.verse.reference);
      }
    } catch (error) {
      console.error('Failed to save memorization history:', error);
      throw error; // Don't use localStorage fallback anymore
    }
  }

  static async getMemorizationHistory(): Promise<MemorizationHistory[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user, returning empty history');
        return [];
      }

      console.log('Loading memorization history from Supabase for user:', user.id);

      const { data, error } = await supabase
        .from('memorization_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_practiced', { ascending: false })
        .limit(50);

      if (error) throw error;

      console.log('Loaded history from Supabase:', data?.length || 0, 'entries');

      // Transform database records to MemorizationHistory format
      return (data || []).map(record => ({
        id: record.id,
        verse: {
          id: `verse-${record.id}`,
          text: record.verse_text,
          reference: record.verse_reference,
          testament: record.verse_testament
        },
        attempts: record.attempts,
        bestAccuracy: record.best_accuracy,
        averageAccuracy: record.average_accuracy,
        totalTime: record.total_time,
        lastPracticed: new Date(record.last_practiced),
        status: record.status,
        userInput: record.user_input,
        comparisonResult: record.comparison_result
      }));
    } catch (error) {
      console.error('Failed to load memorization history:', error);
      return [];
    }
  }

  static async deleteHistoryEntry(entryId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('memorization_history')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('Deleted history entry:', entryId);
    } catch (error) {
      console.error('Failed to delete history entry:', error);
    }
  }
}