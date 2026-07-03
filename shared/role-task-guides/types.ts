export type TaskGuideTask = {
  title: string;
  detail: string;
  when?: string;
};

export type RoleTaskGuide = {
  appKey: string;
  variantKey?: string;
  roleTitle: string;
  tagline: string;
  responsibilities: string[];
  dailyTasks: TaskGuideTask[];
  boundaries: string[];
};
