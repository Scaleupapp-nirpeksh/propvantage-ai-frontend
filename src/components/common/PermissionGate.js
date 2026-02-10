// File: src/components/common/PermissionGate.js
// Declarative permission gate — renders children only if user has required permission(s).

import { useAuth } from '../../context/AuthContext';

const PermissionGate = ({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}) => {
  const { checkPerm, checkAnyPerm, checkAllPerms } = useAuth();

  let hasAccess = false;

  if (permission) {
    hasAccess = checkPerm(permission);
  } else if (anyOf) {
    hasAccess = checkAnyPerm(...anyOf);
  } else if (allOf) {
    hasAccess = checkAllPerms(...allOf);
  } else {
    hasAccess = true;
  }

  return hasAccess ? children : fallback;
};

export default PermissionGate;
