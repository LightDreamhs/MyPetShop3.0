/**
 * 会员级别配置
 */
export const MEMBER_LEVELS = [
  {
    value: 0,
    label: '非会员',
    shortLabel: '非会员',
    color: '#9ca3af',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    badgeVariant: 'default' as const,
  },
  {
    value: 1,
    label: '初级会员',
    shortLabel: '会员',
    color: '#10b981',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    badgeVariant: 'success' as const,
  },
  {
    value: 2,
    label: '中级会员',
    shortLabel: '会员',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    badgeVariant: 'processing' as const,
  },
  {
    value: 3,
    label: '高级会员',
    shortLabel: '会员',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    borderColor: '#c4b5fd',
    badgeVariant: 'warning' as const,
  },
  {
    value: 4,
    label: '至尊会员',
    shortLabel: '会员',
    color: '#ef4444',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    badgeVariant: 'error' as const,
  },
] as const;

export type MemberLevelValue = 0 | 1 | 2 | 3 | 4;

/**
 * 根据级别值获取级别信息
 */
export const getMemberLevelInfo = (level: number) => {
  return MEMBER_LEVELS.find(l => l.value === level) || MEMBER_LEVELS[0];
};

/**
 * 判断是否为会员
 */
export const isMember = (memberLevel: number): boolean => {
  return memberLevel > 0;
};

/**
 * 获取会员状态标签（二元）- 用于列表显示
 */
export const getMemberStatusLabel = (memberLevel: number): string => {
  return isMember(memberLevel) ? '会员' : '非会员';
};

/**
 * 获取会员级别标签（五级）- 用于详情显示
 */
export const getMemberLevelLabel = (memberLevel: number): string => {
  return getMemberLevelInfo(memberLevel).label;
};

/**
 * 获取会员级别颜色
 */
export const getMemberLevelColor = (memberLevel: number): string => {
  return getMemberLevelInfo(memberLevel).color;
};

/**
 * 获取会员级别背景色
 */
export const getMemberLevelBgColor = (memberLevel: number): string => {
  return getMemberLevelInfo(memberLevel).bgColor;
};

/**
 * 获取会员级别边框色
 */
export const getMemberLevelBorderColor = (memberLevel: number): string => {
  return getMemberLevelInfo(memberLevel).borderColor;
};

/**
 * 获取 Badge variant
 */
export const getMemberLevelBadgeVariant = (memberLevel: number) => {
  return getMemberLevelInfo(memberLevel).badgeVariant;
};
