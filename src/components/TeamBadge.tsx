import React from 'react';
import { Team } from '../types/teams';

interface TeamBadgeProps {
  team: Pick<Team, 'name' | 'logo'> & Partial<Pick<Team, 'primaryColor' | 'secondaryColor'>>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const FALLBACK_PRIMARY = '#2563EB';
const FALLBACK_SECONDARY = '#E5E7EB';
const DARK_TEXT = '#0F172A';
const LIGHT_TEXT = '#FFFFFF';

const sizeClasses: Record<NonNullable<TeamBadgeProps['size']>, string> = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm',
  xl: 'h-16 w-16 text-base',
};

const normalizeHexColor = (color?: string) => {
  if (!color) return null;

  const normalized = color.trim();
  return /^#([\da-f]{3}|[\da-f]{6})$/i.test(normalized) ? normalized : null;
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map(value => `${value}${value}`).join('')
    : normalized;

  const value = Number.parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const getRelativeLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map(channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const getContrastRatio = (foreground: string, background: string) => {
  const lighter = Math.max(getRelativeLuminance(foreground), getRelativeLuminance(background));
  const darker = Math.min(getRelativeLuminance(foreground), getRelativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

const getBadgeText = (team: TeamBadgeProps['team']) => {
  const compactName = team.name.replace(/[^\p{L}\p{N}]+/gu, '');
  if (compactName.length > 0 && compactName.length <= 3) {
    return compactName.toLocaleUpperCase('da-DK');
  }

  const words = team.name
    .split(/\s+/)
    .map(word => word.replace(/[^\p{L}\p{N}]+/gu, ''))
    .filter(Boolean);

  if (words.length >= 2 && words[0].length <= 3) {
    return `${words[0]}${words[1][0]}`.slice(0, 3).toLocaleUpperCase('da-DK');
  }

  if (words.length >= 2 && words[words.length - 1].length <= 3) {
    return `${words[0][0]}${words[words.length - 1]}`.slice(0, 3).toLocaleUpperCase('da-DK');
  }

  const initials = words.slice(0, 2).map(word => word[0]).join('');
  if (initials) {
    return initials.toLocaleUpperCase('da-DK');
  }

  return team.logo.trim() || '?';
};

const TeamBadge: React.FC<TeamBadgeProps> = ({ team, size = 'md', className = '' }) => {
  const primaryColor = normalizeHexColor(team.primaryColor) ?? FALLBACK_PRIMARY;
  const secondaryColor = normalizeHexColor(team.secondaryColor) ?? FALLBACK_SECONDARY;
  const whiteContrast = Math.min(
    getContrastRatio(LIGHT_TEXT, primaryColor),
    getContrastRatio(LIGHT_TEXT, secondaryColor),
  );
  const darkContrast = Math.min(
    getContrastRatio(DARK_TEXT, primaryColor),
    getContrastRatio(DARK_TEXT, secondaryColor),
  );
  const textColor = whiteContrast >= darkContrast ? LIGHT_TEXT : DARK_TEXT;
  const badgeText = getBadgeText(team);

  return (
    <span
      role="img"
      aria-label={`${team.name} klubbadge`}
      title={team.name}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 ring-1 ring-white/80 shadow-sm font-black uppercase tracking-[0.08em] ${sizeClasses[size]} ${className}`.trim()}
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 50%, ${secondaryColor} 100%)`,
        color: textColor,
        textShadow: textColor === LIGHT_TEXT ? '0 1px 2px rgba(0, 0, 0, 0.45)' : '0 1px 2px rgba(255, 255, 255, 0.35)',
      }}
    >
      <span
        aria-hidden="true"
        className="rounded-full px-1.5 py-0.5 leading-none"
        style={{ backgroundColor: textColor === LIGHT_TEXT ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.28)' }}
      >
        {badgeText}
      </span>
    </span>
  );
};

export default TeamBadge;
