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
    practiceTime: number
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user, cannot save history');
        return;
      }

      // Check if this verse already exists in history
      const { data: existingHistory, error: fetchError } = await supabase
        .from('memorization_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('verse_reference', session.verse.reference)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingHistory) {
        // Update existing entry
        const newAttempts = existingHistory.attempts + 1;
        const newAverageAccuracy = ((existingHistory.average_accuracy * existingHistory.attempts) + accuracy) / newAttempts;
        const newStatus = accuracy >= 95 ? 'mastered' : accuracy >= 80 ? 'reviewing' : 'learning';

        const { error: updateError } = await supabase
          .from('memorization_history')
          .update({
            attempts: newAttempts,
            best_accuracy: Math.max(existingHistory.best_accuracy, accuracy),
            average_accuracy: newAverageAccuracy,
            total_time: existingHistory.total_time + practiceTime,
            last_practiced: new Date().toISOString(),
            status: newStatus
          })
          .eq('id', existingHistory.id);

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
            status: newStatus
          });

        if (insertError) throw insertError;
        console.log('Created new history entry for:', session.verse.reference);
      }
    } catch (error) {
      console.error('Failed to save memorization history:', error);
      // Fallback to localStorage if Supabase fails
      this.saveToLocalStorageFallback(session, accuracy, practiceTime);
    }
  }

  static async getMemorizationHistory(): Promise<MemorizationHistory[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user, returning empty history');
        return [];
      }

      const { data, error } = await supabase
        .from('memorization_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_practiced', { ascending: false })
        .limit(50);

      if (error) throw error;

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
        status: record.status
      }));
    } catch (error) {
      console.error('Failed to load memorization history:', error);
      // Fallback to localStorage if Supabase fails
      return this.getFromLocalStorageFallback();
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

  // Fallback methods for localStorage
  private static saveToLocalStorageFallback(
    session: MemorizationSession,
    accuracy: number,
    practiceTime: number
  ): void {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('bibleMemoryHistory') || '[]');
      const existingIndex = existingHistory.findIndex((item: any) => 
        item.verse.reference === session.verse.reference
      );
      
      if (existingIndex >= 0) {
        const existing = existingHistory[existingIndex];
        existingHistory[existingIndex] = {
          ...existing,
          attempts: existing.attempts + 1,
          bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
          averageAccuracy: ((existing.averageAccuracy * (existing.attempts - 1)) + accuracy) / existing.attempts,
          totalTime: (existing.totalTime || 0) + practiceTime,
          lastPracticed: new Date(),
          status: accuracy >= 95 ? 'mastered' : accuracy >= 80 ? 'reviewing' : 'learning'
        };
      } else {
        const newHistoryItem = {
          id: `history-${Date.now()}`,
          verse: session.verse,
          attempts: 1,
          bestAccuracy: accuracy,
          averageAccuracy: accuracy,
          totalTime: practiceTime,
          lastPracticed: new Date(),
          status: accuracy >= 95 ? 'mastered' : accuracy >= 80 ? 'reviewing' : 'learning'
        };
        existingHistory.unshift(newHistoryItem);
      }
      
      localStorage.setItem('bibleMemoryHistory', JSON.stringify(existingHistory));
      console.log('Saved to localStorage fallback');
    } catch (error) {
      console.error('Failed to save to localStorage fallback:', error);
    }
  }

  private static getFromLocalStorageFallback(): MemorizationHistory[] {
    try {
      const savedHistory = localStorage.getItem('bibleMemoryHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error('Failed to load from localStorage fallback:', error);
      return [];
    }
  }
}