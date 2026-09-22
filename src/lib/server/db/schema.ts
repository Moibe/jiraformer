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

export const taskFlags = sqliteTable('task_flags', {
	issueKey: text('issue_key').primaryKey(),
	sentToUsercare: integer('sent_to_usercare', { mode: 'boolean' }).notNull().default(false),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});
