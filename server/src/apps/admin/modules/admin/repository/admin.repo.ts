import type { AdminPageQuery } from '@shared/schema/admin';
import { type InferInput, ripple } from 'cyrenejs';
import { and, eq } from 'drizzle-orm';

import { Database } from '#context/tokens';
import { QueryPageBuilder } from '#db/helper';
import { admins, type InsertAdmin, type UpdateAdmin } from '#db/schema';
import { BadRequestError, BaseErrors } from '#utils';

export const AdminRepo = ripple(
  {
    Database,
  },
  ({ Database }) => ({
    async findById(adminId: string) {
      return Database.query.admins.findFirst({
        where: {
          id: adminId,
        },
      });
    },

    async findByUid(uid: string) {
      return await Database.query.admins.findFirst({
        where: {
          uid,
        },
      });
    },

    async findByUsername(username: string) {
      return await Database.query.admins.findFirst({
        where: {
          username,
        },
      });
    },

    async create(input: InsertAdmin) {
      const [admin] = await Database.insert(admins).values(input).returning();

      if (!admin) {
        throw new BaseErrors.BadRequestError('管理员创建失败');
      }

      return admin;
    },

    async updateLastLoginAt(adminId: string, lastLoginAt = new Date()) {
      const [admin] = await Database.update(admins)
        .set({ lastLoginAt })
        .where(and(eq(admins.id, adminId)))
        .returning();

      return admin;
    },

    async update(adminId: string, input: UpdateAdmin) {
      const [admin] = await Database.update(admins)
        .set(input)
        .where(eq(admins.id, adminId))
        .returning({
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
      const [admin] = await Database.update(admins)
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
      const [admin] = await Database.update(admins)
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
      const [admin] = await Database.update(admins)
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
      return new QueryPageBuilder(Database, admins, Database.query.admins)
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

export type AdminRepository = InferInput<typeof AdminRepo>;
