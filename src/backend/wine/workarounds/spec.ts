import { WorkaroundImplementation } from './types'
import dxvk from './impl/dxvk'
import vkd3d from './impl/vkd3d'

export const Workarounds = {
  dxvk,
  vkd3d
} satisfies Record<string, WorkaroundImplementation>
