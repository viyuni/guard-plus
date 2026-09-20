import type { AdminPageQuery } from '@shared/schema/admin';
import { type InferInput, ripple } from 'cyrenejs';
import { and, eq } from 'drizzle-orm';

import { Database } from '#context/tokens';
import { QueryPageBuilder } from '#db/helper';
import { admins, type InsertAdmin, type UpdateAdmin } from '#db/schema';
import { BadRequestError, BaseErrors } from '#utils';

export const adminRepo = ripple(
  {
    db: Database,
  },
  ({ db }) => ({
    async findById(adminId: string) {
      return db.query.admins.findFirst({
        where: {
          id: adminId,
        },
      });
    },

    async findByUid(uid: string) {
      return await db.query.admins.findFirst({
        where: {
          uid,
        },
      });
    },

    async findByUsername(username: string) {
      return await db.query.admins.findFirst({
        where: {
          username,
        },
      });
    },

    async create(input: InsertAdmin) {
      const [admin] = await db.insert(admins).values(input).returning();

      if (!admin) {
        throw new BaseErrors.BadRequestError('管理员创建失败');
      }

      return admin;
    },

    async updateLastLoginAt(adminId: string, lastLoginAt = new Date()) {
      const [admin] = await db
        .update(admins)
        .set({ lastLoginAt })
        .where(and(eq(admins.id, adminId)))
        .returning();

      return admin;
    },

    async update(adminId: string, input: UpdateAdmin) {
      const [admin] = await db.update(admins).set(input).where(eq(admins.id, adminId)).returning({
        id: admins.id,
        uid: admins.uid,
        username: admins.username,
        status: admins.status,
        role: admins.role,
        remark: admins.remark,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      });

      return admin;
    },

    async updatePassword(adminId: string, passwordHash: string) {
      const [admin] = await db
        .update(admins)
        .set({ passwordHash })
        .where(eq(admins.id, adminId))
        .returning({
          id: admins.id,
          uid: admins.uid,
          username: admins.username,
        });

      if (!admin) {
        throw new BadRequestError('密码更新失败');
      }
    },

    async ban(adminId: string) {
      const [admin] = await db
        .update(admins)
        .set({ status: 'banned' })
        .where(and(eq(admins.id, adminId), eq(admins.role, 'admin'), eq(admins.status, 'active')))
        .returning({
          id: admins.id,
          status: admins.status,
          role: admins.role,
        });

      return admin;
    },

    async restore(adminId: string) {
      const [admin] = await db
        .update(admins)
        .set({ status: 'active' })
        .where(and(eq(admins.id, adminId), eq(admins.role, 'admin'), eq(admins.status, 'banned')))
        .returning({
          id: admins.id,
          status: admins.status,
          role: admins.role,
        });

      return admin;
    },

    page(query: AdminPageQuery) {
      return new QueryPageBuilder(db, admins, db.query.admins)
        .query((findMany, { limit, offset }) =>
          findMany({
            limit,
            offset,
            columns: {
              id: true,
              uid: true,
              username: true,
              status: true,
              role: true,
              lastLoginAt: true,
              remark: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          }),
        )
        .page(query.page)
        .pageSize(query.pageSize)
        .paginate();
    },
  }),
  { debugName: 'AdminRepository' },
);

export type AdminRepository = InferInput<typeof adminRepo>;
