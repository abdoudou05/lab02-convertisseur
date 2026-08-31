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
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';

/** Correspondance entre le nom d'icône fourni par l'API et le composant MUI. */
const ICONS = {
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
  local_gas_station: LocalGasStationIcon,
};

export function CategoryIcon({ name, ...props }) {
  const Icon = ICONS[name] ?? CategoryOutlinedIcon;
  return <Icon {...props} />;
}
