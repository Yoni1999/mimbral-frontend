import DateRangeIcon from "@mui/icons-material/DateRange";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

const MetasMenuitems = [
  {
    id: "crear-periodo",
    title: "Crear Período",
    href: "/metas/crear-periodo",
    icon: DateRangeIcon,
  },
  {
    id: "crear-meta",
    title: "Crear Meta",
    href: "/metas/crear-meta",
    icon: PlaylistAddIcon,
  },
  {
    id: "asignar-meta",
    title: "Asignar a Vendedor",
    href: "/metas/asignar-meta",
    icon: GroupAddIcon,
  },
];

export default MetasMenuitems;
