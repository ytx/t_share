import cron from 'node-cron';
import prisma from '../database/connection';
import logger from '../utils/logger';

/**
 * ユーザークリーンアップ機能
 * 申請から7日以上経過した未承認ユーザーを削除
 */
export const cleanupPendingUsers = async (): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 7日以上前に申請された未承認ユーザーを検索
    const expiredUsers = await prisma.user.findMany({
      where: {
        approvalStatus: 'pending',
        appliedAt: {
          lt: sevenDaysAgo
        }
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        appliedAt: true
      }
    });

    if (expiredUsers.length === 0) {
      logger.info('No expired pending users found');
      return;
    }

    // 期限切れユーザーを削除
    const deletedCount = await prisma.user.deleteMany({
      where: {
        id: {
          in: expiredUsers.map(user => user.id)
        }
      }
    });

    logger.info(`Cleaned up ${deletedCount.count} expired pending users`, {
      deletedUsers: expiredUsers.map(user => ({
        email: user.email,
        displayName: user.displayName,
        appliedAt: user.appliedAt
      }))
    });

  } catch (error) {
    logger.error('Failed to cleanup pending users:', error);
    throw error;
  }
};

/**
 * node-cronジョブの設定
 * 毎日午前2時に実行
 */
const startUserCleanupJob = (): void => {
  // 環境変数でcronジョブの有効/無効を制御
  const enableCronJobs = process.env.ENABLE_CRON_JOBS === 'true';

  if (!enableCronJobs) {
    logger.info('Cron jobs are disabled');
    return;
  }

  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting user cleanup job...');
    try {
      await cleanupPendingUsers();
      logger.info('User cleanup job completed successfully');
    } catch (error) {
      logger.error('User cleanup job failed:', error);
    }
  }, {
    timezone: 'Asia/Tokyo'
  });

  logger.info('User cleanup cron job scheduled (daily at 2:00 AM JST)');
};

export default startUserCleanupJob;