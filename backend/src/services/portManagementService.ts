import prisma from '../config/database';

// ポート用の標準変数名
export const PORT_VARIABLE_NAMES = {
  FRONTEND_DEV: 'PORT_FRONTEND_DEV',
  BACKEND_DEV: 'PORT_BACKEND_DEV',
  DATABASE_DEV: 'PORT_DATABASE_DEV',
  FRONTEND_DOCKER: 'PORT_FRONTEND_DOCKER',
  BACKEND_DOCKER: 'PORT_BACKEND_DOCKER',
  DATABASE_DOCKER: 'PORT_DATABASE_DOCKER',
} as const;

// ポート範囲定義
export const PORT_RANGES = {
  FRONTEND_DEV: { start: 13200, prefix: 'frontend_dev' },
  BACKEND_DEV: { start: 14200, prefix: 'backend_dev' },
  DATABASE_DEV: { start: 15200, prefix: 'database_dev' },
  FRONTEND_DOCKER: { start: 3200, prefix: 'frontend_docker' },
  BACKEND_DOCKER: { start: 4200, prefix: 'backend_docker' },
  DATABASE_DOCKER: { start: 5200, prefix: 'database_docker' },
} as const;

export type PortVariableName = typeof PORT_VARIABLE_NAMES[keyof typeof PORT_VARIABLE_NAMES];
export type PortRangeKey = keyof typeof PORT_RANGES;

class PortManagementService {
  /**
   * プロジェクト作成時にポートを自動割り当て
   */
  async assignPortsForNewProject(projectId: number, createdBy: number): Promise<void> {
    for (const [key, range] of Object.entries(PORT_RANGES)) {
      const portNumber = await this.findNextAvailablePort(range.start);
      const variableName = PORT_VARIABLE_NAMES[key as PortRangeKey];

      await prisma.projectVariable.create({
        data: {
          projectId,
          name: variableName,
          value: portNumber.toString(),
          description: `${range.prefix}用ポート（自動割り当て）`,
          createdBy,
        },
      });
    }
  }

  /**
   * 利用可能な次のポート番号を検索
   */
  async findNextAvailablePort(startPort: number): Promise<number> {
    const usedPorts = await this.getAllUsedPorts();

    let port = startPort;
    while (usedPorts.includes(port)) {
      port++;
    }
    return port;
  }

  /**
   * 全プロジェクトで使用中のポート一覧を取得
   */
  async getAllUsedPorts(): Promise<number[]> {
    const portVariableNames = Object.values(PORT_VARIABLE_NAMES);
    const variables = await prisma.projectVariable.findMany({
      where: {
        name: { in: portVariableNames },
      },
      select: { value: true },
    });

    return variables
      .map(v => parseInt(v.value, 10))
      .filter(p => !isNaN(p));
  }

  /**
   * ポート競合チェック
   */
  async checkPortConflict(
    projectId: number,
    variableName: PortVariableName,
    newPort: number
  ): Promise<boolean> {
    const existingVariable = await prisma.projectVariable.findFirst({
      where: {
        name: variableName,
        value: newPort.toString(),
        projectId: { not: projectId },
      },
    });

    return existingVariable !== null;
  }

  /**
   * ポート変数更新（競合チェック付き）
   */
  async updatePortVariable(
    projectId: number,
    variableName: PortVariableName,
    newPort: number
  ): Promise<{ success: boolean; error?: string }> {
    // 競合チェック
    const hasConflict = await this.checkPortConflict(projectId, variableName, newPort);

    if (hasConflict) {
      return {
        success: false,
        error: `ポート ${newPort} は既に他のプロジェクトで使用されています`,
      };
    }

    // 更新実行
    await prisma.projectVariable.updateMany({
      where: {
        projectId,
        name: variableName,
      },
      data: {
        value: newPort.toString(),
      },
    });

    return { success: true };
  }

  /**
   * ポート変数が存在しない場合は自動作成
   */
  async ensurePortsExist(projectId: number, createdBy: number): Promise<void> {
    const portVariableNames = Object.values(PORT_VARIABLE_NAMES);
    const existingVariables = await prisma.projectVariable.findMany({
      where: {
        projectId,
        name: { in: portVariableNames },
      },
    });

    const existingNames = existingVariables.map(v => v.name);
    const missingPorts = Object.entries(PORT_RANGES).filter(
      ([key]) => !existingNames.includes(PORT_VARIABLE_NAMES[key as PortRangeKey])
    );

    // 不足しているポート変数を作成
    for (const [key, range] of missingPorts) {
      const portNumber = await this.findNextAvailablePort(range.start);
      const variableName = PORT_VARIABLE_NAMES[key as PortRangeKey];

      await prisma.projectVariable.create({
        data: {
          projectId,
          name: variableName,
          value: portNumber.toString(),
          description: `${range.prefix}用ポート（自動割り当て）`,
          createdBy,
        },
      });
    }
  }

  /**
   * プロジェクトのポート変数を取得
   */
  async getProjectPorts(projectId: number): Promise<Record<string, number>> {
    const portVariableNames = Object.values(PORT_VARIABLE_NAMES);
    const variables = await prisma.projectVariable.findMany({
      where: {
        projectId,
        name: { in: portVariableNames },
      },
    });

    const ports: Record<string, number> = {};
    variables.forEach(variable => {
      ports[variable.name] = parseInt(variable.value, 10);
    });

    return ports;
  }

  /**
   * 全プロジェクトのポート使用状況を取得
   */
  async getAllPortUsage(): Promise<Array<{ projectId: number; projectName: string; ports: Record<string, number> }>> {
    const projects = await prisma.project.findMany({
      include: {
        projectVariables: {
          where: {
            name: { in: Object.values(PORT_VARIABLE_NAMES) },
          },
        },
      },
    });

    return projects.map(project => ({
      projectId: project.id,
      projectName: project.name,
      ports: project.projectVariables.reduce((acc, variable) => {
        acc[variable.name] = parseInt(variable.value, 10);
        return acc;
      }, {} as Record<string, number>),
    }));
  }
}

export default new PortManagementService();
