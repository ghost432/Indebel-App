import LabelBadge from './LabelBadge';

const UserNameWithLabel = ({ user, userId, className = '', showLabel = true }) => {
  const displayName = user 
    ? `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email 
    : '';

  const targetUserId = userId || user?.id;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span>{displayName}</span>
      {showLabel && targetUserId && <LabelBadge userId={targetUserId} size="md" />}
    </span>
  );
};

export default UserNameWithLabel;
