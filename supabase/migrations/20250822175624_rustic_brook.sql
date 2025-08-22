/*
  # Create memorization history table

  1. New Tables
    - `memorization_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `verse_text` (text)
      - `verse_reference` (text)
      - `verse_testament` (text)
      - `attempts` (integer)
      - `best_accuracy` (integer)
      - `average_accuracy` (numeric)
      - `total_time` (integer, seconds)
      - `last_practiced` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `memorization_history` table
    - Add policy for authenticated users to manage their own history
*/

CREATE TABLE IF NOT EXISTS memorization_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_text text NOT NULL,
  verse_reference text NOT NULL,
  verse_testament text NOT NULL CHECK (verse_testament IN ('OT', 'NT')),
  attempts integer DEFAULT 1 NOT NULL,
  best_accuracy integer DEFAULT 0 NOT NULL CHECK (best_accuracy >= 0 AND best_accuracy <= 100),
  average_accuracy numeric DEFAULT 0 NOT NULL CHECK (average_accuracy >= 0 AND average_accuracy <= 100),
  total_time integer DEFAULT 0 NOT NULL,
  last_practiced timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'learning' NOT NULL CHECK (status IN ('learning', 'reviewing', 'mastered')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE memorization_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memorization history"
  ON memorization_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_memorization_history_user_id ON memorization_history(user_id);
CREATE INDEX IF NOT EXISTS idx_memorization_history_last_practiced ON memorization_history(last_practiced DESC);
CREATE INDEX IF NOT EXISTS idx_memorization_history_verse_reference ON memorization_history(user_id, verse_reference);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_memorization_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memorization_history_updated_at
  BEFORE UPDATE ON memorization_history
  FOR EACH ROW
  EXECUTE FUNCTION update_memorization_history_updated_at();