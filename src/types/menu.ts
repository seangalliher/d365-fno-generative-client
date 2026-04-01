/**
 * Menu structure types for the navigation hierarchy.
 */

export interface MenuModule {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly description?: string;
  readonly items: MenuItem[];
  readonly subModules?: MenuModule[];
  readonly order: number;
}

export interface MenuItem {
  readonly menuItemName: string;
  readonly menuItemType: "Display" | "Action";
  readonly label: string;
  readonly description?: string;
  readonly entitySet?: string;
  readonly formCached: boolean;
  readonly lastAccessed?: string;
  readonly accessCount: number;
  readonly tags?: string[];
}

export interface MenuCache {
  readonly version: number;
  readonly generatedAt: string;
  readonly modules: MenuModule[];
}

export interface NavigationEntry {
  readonly path: string;
  readonly label: string;
  readonly menuItemName?: string;
  readonly entitySet?: string;
  readonly recordId?: string;
  readonly timestamp: string;
}

export interface SearchResult {
  readonly type: "menuItem" | "module" | "entity";
  readonly label: string;
  readonly description?: string;
  readonly path: string;
  readonly menuItemName?: string;
  readonly menuItemType?: "Display" | "Action";
  readonly moduleId?: string;
  readonly score: number;
}
