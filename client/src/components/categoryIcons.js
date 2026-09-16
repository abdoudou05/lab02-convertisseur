/**
 * Correspondance entre le nom d'icône fourni par l'API (champ `icon` de chaque
 * catégorie) et le composant Material UI.
 *
 * Isolée dans un module sans JSX pour être importable par `node --test` :
 * le test client/test/category-icons.test.js vérifie que chaque catégorie du
 * serveur y trouve son icône.
 */
import StraightenIcon from '@mui/icons-material/Straighten';
import ScaleIcon from '@mui/icons-material/Scale';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CropFreeIcon from '@mui/icons-material/CropFree';
import SpeedIcon from '@mui/icons-material/Speed';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CompressIcon from '@mui/icons-material/Compress';
import BoltIcon from '@mui/icons-material/Bolt';
import PowerIcon from '@mui/icons-material/Power';
import StorageIcon from '@mui/icons-material/Storage';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SettingsIcon from '@mui/icons-material/Settings';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import GrainIcon from '@mui/icons-material/Grain';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';

export const CATEGORY_ICONS = {
  straighten: StraightenIcon,
  scale: ScaleIcon,
  local_drink: LocalDrinkIcon,
  thermostat: ThermostatIcon,
  crop_free: CropFreeIcon,
  speed: SpeedIcon,
  schedule: ScheduleIcon,
  compress: CompressIcon,
  bolt: BoltIcon,
  power: PowerIcon,
  storage: StorageIcon,
  architecture: ArchitectureIcon,
  rocket_launch: RocketLaunchIcon,
  fitness_center: FitnessCenterIcon,
  settings: SettingsIcon,
  graphic_eq: GraphicEqIcon,
  network_check: NetworkCheckIcon,
  grain: GrainIcon,
  local_gas_station: LocalGasStationIcon,
};
