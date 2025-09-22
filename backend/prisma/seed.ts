import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@template-share.com' },
    update: {},
    create: {
      email: 'admin@template-share.com',
      username: 'admin',
      displayName: 'Administrator',
      passwordHash: adminPasswordHash,
      isAdmin: true,
    },
  });

  // Create test user
  const testPasswordHash = await bcrypt.hash('test123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@template-share.com' },
    update: {},
    create: {
      email: 'test@template-share.com',
      username: 'testuser',
      displayName: 'Test User',
      passwordHash: testPasswordHash,
      isAdmin: false,
    },
  });

  // Create default scenes
  const meetingScene = await prisma.scene.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'ミーティング',
      description: '会議や打ち合わせ関連のテンプレート',
      createdBy: adminUser.id,
    },
  });

  const reportScene = await prisma.scene.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'レポート',
      description: '報告書や進捗レポート関連のテンプレート',
      createdBy: adminUser.id,
    },
  });

  await prisma.scene.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'メール',
      description: 'メール文面のテンプレート',
      createdBy: adminUser.id,
    },
  });

  // Create default tags
  const workTag = await prisma.tag.upsert({
    where: { name: '仕事' },
    update: {},
    create: {
      name: '仕事',
      description: '業務関連',
      color: '#1976d2',
      createdBy: adminUser.id,
    },
  });

  await prisma.tag.upsert({
    where: { name: '緊急' },
    update: {},
    create: {
      name: '緊急',
      description: '緊急度の高い案件',
      color: '#d32f2f',
      createdBy: adminUser.id,
    },
  });

  const dailyTag = await prisma.tag.upsert({
    where: { name: '日次' },
    update: {},
    create: {
      name: '日次',
      description: '日常的に使用するテンプレート',
      color: '#388e3c',
      createdBy: adminUser.id,
    },
  });

  // Create default project
  const defaultProject = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'デフォルトプロジェクト',
      description: '初期設定用のサンプルプロジェクト',
      createdBy: adminUser.id,
    },
  });

  // Create sample templates
  const meetingTemplate = await prisma.template.create({
    data: {
      title: '会議議事録テンプレート',
      content: `# 会議議事録

## 基本情報
- **日時**: {{date}}
- **場所**: {{location}}
- **参加者**: {{participants}}
- **司会**: {{facilitator}}

## アジェンダ
1. {{agenda1}}
2. {{agenda2}}
3. {{agenda3}}

## 議論内容
### {{topic1}}
- 内容: {{content1}}
- 決定事項: {{decision1}}

### {{topic2}}
- 内容: {{content2}}
- 決定事項: {{decision2}}

## アクションアイテム
- [ ] {{action1}} (担当: {{assignee1}}, 期限: {{deadline1}})
- [ ] {{action2}} (担当: {{assignee2}}, 期限: {{deadline2}})

## 次回会議
- 日時: {{nextMeetingDate}}
- アジェンダ: {{nextAgenda}}`,
      description: '標準的な会議議事録のテンプレート',
      sceneId: meetingScene.id,
      status: 'published',
      isPublic: true,
      createdBy: adminUser.id,
    },
  });

  const dailyReportTemplate = await prisma.template.create({
    data: {
      title: '日報テンプレート',
      content: `# 日報 - {{date}}

## 今日の作業内容
### 完了したタスク
- [ ] {{completedTask1}}
- [ ] {{completedTask2}}
- [ ] {{completedTask3}}

### 進行中のタスク
- {{ongoingTask1}} (進捗: {{progress1}}%)
- {{ongoingTask2}} (進捗: {{progress2}}%)

## 課題・困ったこと
{{issues}}

## 明日の予定
- {{tomorrowTask1}}
- {{tomorrowTask2}}
- {{tomorrowTask3}}

## 共有事項
{{sharing}}`,
      description: '日次の作業報告用テンプレート',
      sceneId: reportScene.id,
      status: 'published',
      isPublic: true,
      createdBy: adminUser.id,
    },
  });

  // Add tags to templates
  await prisma.templateTag.createMany({
    data: [
      { templateId: meetingTemplate.id, tagId: workTag.id },
      { templateId: dailyReportTemplate.id, tagId: workTag.id },
      { templateId: dailyReportTemplate.id, tagId: dailyTag.id },
    ],
  });

  // Create user variables
  await prisma.userVariable.createMany({
    data: [
      {
        userId: testUser.id,
        name: 'myName',
        value: 'テストユーザー',
        description: '自分の名前',
      },
      {
        userId: testUser.id,
        name: 'myEmail',
        value: 'test@template-share.com',
        description: '自分のメールアドレス',
      },
    ],
  });

  // Create project variables
  await prisma.projectVariable.createMany({
    data: [
      {
        projectId: defaultProject.id,
        name: 'projectName',
        value: 'デフォルトプロジェクト',
        description: 'プロジェクト名',
        createdBy: adminUser.id,
      },
      {
        projectId: defaultProject.id,
        name: 'teamLead',
        value: 'プロジェクトリーダー',
        description: 'チームリーダー名',
        createdBy: adminUser.id,
      },
    ],
  });

  // Create user preferences
  await prisma.userPreference.createMany({
    data: [
      {
        userId: adminUser.id,
        theme: 'light',
        editorKeybinding: 'default',
        editorShowLineNumbers: true,
        editorWordWrap: true,
        editorShowWhitespace: false,
        panelSplitRatio: 0.5,
      },
      {
        userId: testUser.id,
        theme: 'light',
        editorKeybinding: 'default',
        editorShowLineNumbers: true,
        editorWordWrap: true,
        editorShowWhitespace: false,
        panelSplitRatio: 0.4,
      },
    ],
  });

  console.log('✅ Database seed completed successfully!');
  console.log(`👤 Admin user: admin@template-share.com / admin123`);
  console.log(`👤 Test user: test@template-share.com / test123`);
  console.log(`📝 Created ${await prisma.template.count()} templates`);
  console.log(`🏷️ Created ${await prisma.tag.count()} tags`);
  console.log(`🎬 Created ${await prisma.scene.count()} scenes`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });