import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const generations = sqliteTable('generations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	issueKey: text('issue_key').notNull(),
	url: text('url').notNull(),
	text: text('text').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});
