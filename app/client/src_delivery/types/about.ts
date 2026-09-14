export interface StatItem {
  value: string;
  label: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    text: string;
  };
}

export interface MissionPoint {
  icon: string;
  text: string;
  highlight?: string;
}

export interface ValueCard {
  icon: string;
  title: string;
  description: string;
  iconStyle: {
    background: string;
    color: string;
  };
}

export interface ModuleItem {
  icon: string;
  title: string;
  description: string;
}

export interface TeamMember {
  initials: string;
  name: string;
  role: string;
  avatarColor: string;
  links: {
    platform: "linkedin" | "github" | "email" | "dribbble";
    url: string;
  }[];
}
