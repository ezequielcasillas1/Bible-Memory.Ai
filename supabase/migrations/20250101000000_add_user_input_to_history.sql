/*
  # Add user input field to memorization history

  1. Changes
    - Add `user_input` column to store the user's actual typed text
    - Add `comparison_result` column to store detailed comparison data (JSON)
    - Update existing records to have null values (backward compatible)

  2. Backward Compatibility
    - Existing records will have null user_input
    - Application handles null values gracefully
*/

-- Add user_input column to store what the user actually typed
ALTER TABLE memorization_history 
ADD COLUMN user_input text;

-- Add comparison_result column to store detailed word-by-word comparison
ALTER TABLE memorization_history 
ADD COLUMN comparison_result jsonb;

-- Add comment for documentation
COMMENT ON COLUMN memorization_history.user_input IS 'The actual text typed by the user during memorization';
COMMENT ON COLUMN memorization_history.comparison_result IS 'Detailed comparison results including word-by-word analysis (JSON)';
