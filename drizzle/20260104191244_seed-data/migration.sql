-- Custom SQL migration file, put your code below! --
INSERT INTO `categories` (`id`, `name`, `created_at`)
VALUES
    ('91cfe797-bcb2-416e-a6ea-f404f7160a34', 'Ambience', strftime('%Y-%m-%dT%H:%M:%fZ', datetime('now'))),
    ('2ecc9c60-a24a-4b0a-a970-e6d38da69864', 'Music', strftime('%Y-%m-%dT%H:%M:%fZ', datetime('now'))),
    ('b3e63fb0-c9ad-43a4-844a-9fd635b2ccf9', 'SFX', strftime('%Y-%m-%dT%H:%M:%fZ', datetime('now')));
--> statement-breakpoint
INSERT INTO `genres` (`id`, `name`, `created_at`)
VALUES
    ('59418d3c-471d-4585-b961-d4fa1018cb36', 'Fantasy', strftime('%Y-%m-%dT%H:%M:%fZ', datetime('now'))),
    ('9fa1fdd6-1440-4d7f-84fb-2a5b4e0c9167', 'Sci-Fi', strftime('%Y-%m-%dT%H:%M:%fZ', datetime('now'))),
    ('5e2d4c67-2187-4bf6-a5d1-8568422f66ef', 'Modern', strftime('%Y-%m-%dT%H:%M:%fZ', datetime('now')));
