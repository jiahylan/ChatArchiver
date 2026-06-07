import fs from 'fs';
import path from 'path';

interface ServerConfig {
  port: number;
  host: string;
}

interface DataConfig {
  path: string;
}

export interface AppConfig {
  server: ServerConfig;
  data: DataConfig;
}

const CONFIG_PATH = path.join(__dirname, '../../config.json');

let config: AppConfig | null = null;

// 重新加载配置（清除缓存）
export function reloadConfig(): AppConfig {
  config = null;
  return loadConfig();
}

export function loadConfig(): AppConfig {
  if (config) {
    return config;
  }

  // 默认配置
  const defaultConfig: AppConfig = {
    server: {
      port: 3000,
      host: 'localhost'
    },
    data: {
      path: './data'
    }
  };

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const loadedConfig = JSON.parse(configContent);
      
      // 合并配置（用户配置覆盖默认配置）
      config = {
        server: {
          ...defaultConfig.server,
          ...loadedConfig.server
        },
        data: {
          ...defaultConfig.data,
          ...loadedConfig.data
        }
      };
      
      console.log('Config loaded:', config);
    } else {
      // 如果配置文件不存在，创建默认配置
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      config = defaultConfig;
    }
  } catch (error) {
    console.error('Failed to load config, using defaults:', error);
    config = defaultConfig;
  }

  return config;
}

export function getServerConfig(): ServerConfig {
  return loadConfig().server;
}

export function getDataConfig(): DataConfig {
  return loadConfig().data;
}

export function getDataPath(): string {
  const dataConfig = getDataConfig();
  const configDir = path.dirname(CONFIG_PATH);
  
  // 如果是相对路径，相对于配置文件所在目录
  if (path.isAbsolute(dataConfig.path)) {
    return dataConfig.path;
  }
  
  return path.resolve(configDir, dataConfig.path);
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}