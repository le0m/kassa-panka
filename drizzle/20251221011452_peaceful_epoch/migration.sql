-- Add type column with a temporary default
ALTER TABLE `sounds` ADD `type` text NOT NULL DEFAULT 'sfx';
