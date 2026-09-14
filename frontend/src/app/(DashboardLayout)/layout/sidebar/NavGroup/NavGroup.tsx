import PropTypes from 'prop-types';
// mui imports
import { Divider, ListSubheader, styled, Theme } from '@mui/material';

type NavGroup = {
  navlabel?: boolean;
  subheader?: string;
};

interface ItemType {
  item: NavGroup;
  /** Riel angosto (solo iconos): el subheader es puro texto, sin icono, asi
   * que no cabe -se reemplaza por una linea divisoria. */
  collapsed?: boolean;
}

const NavGroup = ({ item, collapsed }: ItemType) => {
  const ListSubheaderStyle = styled((props: Theme | any) => <ListSubheader disableSticky {...props} />)(
    ({ theme }) => ({
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginTop: theme.spacing(2.5),
      marginBottom: theme.spacing(0.5),
      color: '#94a3b8',
      lineHeight: '20px',
      padding: '3px 12px',
    }),
  );

  if (collapsed) {
    return <Divider sx={{ my: 1.5, mx: 1.5 }} />;
  }

  return (
    <ListSubheaderStyle>{item.subheader}</ListSubheaderStyle>
  );
};

NavGroup.propTypes = {
  item: PropTypes.object,
};

export default NavGroup;
