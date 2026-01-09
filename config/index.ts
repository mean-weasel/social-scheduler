import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

export interface Config {
  api: {
    port: number
    host: string
  }
  dev: {
    port: number
  }
  test: {
    port: number
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

function loadJson(path: string): Partial<Config> {
  if (!existsSync(path)) {
    return {}
  }
  const content = readFileSync(path, 'utf-8')
  return JSON.parse(content)
}

function deepMerge(target: Config, source: Partial<Config>): Config {
  const result = { ...target }

  if (source.api) {
    result.api = { ...result.api, ...source.api }
  }
  if (source.dev) {
    result.dev = { ...result.dev, ...source.dev }
  }
  if (source.test) {
    result.test = { ...result.test, ...source.test }
  }

  return result
}

const defaultConfig = loadJson(resolve(rootDir, 'config.default.json')) as Config
const userConfig = loadJson(resolve(rootDir, 'config.json'))

export const config: Config = deepMerge(defaultConfig, userConfig)
