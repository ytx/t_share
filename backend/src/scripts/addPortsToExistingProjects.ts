/**
 * 既存プロジェクトにポート変数を追加するスクリプト
 *
 * 実行方法:
 * npx ts-node src/scripts/addPortsToExistingProjects.ts
 */

import prisma from '../config/database';
import portManagementService, { PORT_VARIABLE_NAMES } from '../services/portManagementService';

async function addPortsToExistingProjects() {
  console.log('既存プロジェクトへのポート変数追加を開始します...');

  try {
    // 全プロジェクトを取得
    const projects = await prisma.project.findMany({
      include: {
        projectVariables: true,
      },
    });

    console.log(`対象プロジェクト数: ${projects.length}`);

    for (const project of projects) {
      // 既にポート変数が存在するかチェック
      const hasPortVariables = project.projectVariables.some(v =>
        Object.values(PORT_VARIABLE_NAMES).includes(v.name as any)
      );

      if (hasPortVariables) {
        console.log(`プロジェクト "${project.name}" (ID: ${project.id}) - スキップ（ポート変数が既に存在）`);
        continue;
      }

      // ポート変数を追加
      console.log(`プロジェクト "${project.name}" (ID: ${project.id}) - ポート変数を追加中...`);
      await portManagementService.assignPortsForNewProject(project.id, project.createdBy);
      console.log(`  ✓ 完了`);
    }

    // 最終結果を表示
    console.log('\n=== ポート使用状況 ===');
    const portUsage = await portManagementService.getAllPortUsage();
    portUsage.forEach(usage => {
      console.log(`\nプロジェクト: ${usage.projectName} (ID: ${usage.projectId})`);
      Object.entries(usage.ports).forEach(([name, port]) => {
        console.log(`  ${name}: ${port}`);
      });
    });

    console.log('\n処理が完了しました。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
addPortsToExistingProjects();
