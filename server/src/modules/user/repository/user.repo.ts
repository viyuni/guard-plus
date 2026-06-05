import type { UserPageQuery } from '@shared/schema/user';
import { and, eq } from 'drizzle-orm';

import type { DbExecutor } from '#db';
import { defineSelectColumns, QueryPageBuilder } from '#db/helper';
import type { InsertUser, UpdateUser } from '#db/schema';
import { users } from '#db/schema';
import { BadRequestError } from '#utils';

const userSelectCols = defineSelectColumns(
  users,
  ({ passwordHash: _passwordHash, phoneHash: _phoneHash, ...cols }) => cols,
);

export class UserRepository {
  constructor(private db: DbExecutor) {}

  /**
   * 获取用户
   */
  async findById(userId: string, db: DbExecutor = this.db) {
    const user = await db.query.users.findFirst({
      where: {
        id: userId,
      },
    });

    return user ?? null;
  }

  /**
   * 通过 B站 UID 查询用户
   */
  async findByBiliUid(biliUid: string, db: DbExecutor = this.db) {
    const user = await db.query.users.findFirst({
      where: {
        biliUid,
      },
    });

    return user ?? null;
  }

  /**
   * 查询用户详情
   */
  async findDetailById(userId: string) {
    const user = await this.db.query.users.findFirst({
      columns: {
        id: true,
        biliUid: true,
        username: true,
        status: true,
        phoneEncrypted: true,
        emailEncrypted: true,
        addressEncrypted: true,
      },
      with: {
        pointAccounts: {
          columns: {
            id: true,
            balance: true,
            status: true,
          },
          with: {
            pointType: {
              columns: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
      },
      where: {
        id: userId,
      },
    });

    return user ?? null;
  }

  /**
   * 封禁用户
   */
  async ban(userId: string) {
    const [user] = await this.db
      .update(users)
      .set({
        status: 'banned',
      })
      .where(and(eq(users.id, userId)))
      .returning();

    return user ?? null;
  }

  /**
   * 恢复用户
   */
  async restore(userId: string) {
    const [user] = await this.db
      .update(users)
      .set({
        status: 'active',
      })
      .where(and(eq(users.id, userId)))
      .returning();

    return user ?? null;
  }

  async create(data: InsertUser) {
    const [user] = await this.db.insert(users).values(data).returning(userSelectCols);

    if (!user) {
      throw new BadRequestError('用户创建失败');
    }

    return user;
  }

  async updatePassword(userId: string, passwordHash: string) {
    const [user] = await this.db
      .update(users)
      .set({
        passwordHash,
      })
      .where(eq(users.id, userId))
      .returning(userSelectCols);

    if (!user) {
      throw new BadRequestError('用户创建失败');
    }

    return user;
  }

  async update(userId: string, data: UpdateUser) {
    const [user] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning(userSelectCols);

    if (!user) {
      throw new BadRequestError('用户更新失败');
    }

    return user;
  }

  /**
   * 分页
   */
  page(query: UserPageQuery) {
    return new QueryPageBuilder(this.db, users, this.db.query.users)
      .page(query.page)
      .pageSize(query.pageSize)
      .where({
        status: query.status,
        OR: query.keyword
          ? [
              {
                biliUid: {
                  ilike: `%${query.keyword}%`,
                },
              },
              {
                username: {
                  ilike: `%${query.keyword}%`,
                },
              },
            ]
          : undefined,
      })
      .query((findMany, { where, limit, offset }) =>
        findMany({
          where,
          limit,
          offset,
          columns: {
            id: true,
            biliUid: true,
            username: true,
            status: true,
            phoneEncrypted: true,
            emailEncrypted: true,
            addressEncrypted: true,
            remark: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            pointAccounts: {
              columns: {
                id: true,
                balance: true,
                createdAt: true,
                updatedAt: true,
              },
              with: {
                pointType: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
      .paginate();
  }
}
