/**
 * Action catalog — maps D365 common business actions to form toolbar operations.
 * Each action knows its visual representation and can be invoked via OData action or custom logic.
 */

export interface ActionDefinition {
  readonly name: string;
  readonly label: string;
  readonly icon: string;
  readonly variant: "primary" | "secondary" | "destructive" | "ghost";
  readonly confirmMessage?: string;
  readonly requiresSelection?: boolean;
  readonly category: "lifecycle" | "workflow" | "report" | "utility";
}

/**
 * Common D365 actions applicable across entities.
 */
export const COMMON_ACTIONS: ActionDefinition[] = [
  {
    name: "post",
    label: "Post",
    icon: "send",
    variant: "primary",
    confirmMessage: "Are you sure you want to post this record?",
    category: "lifecycle",
  },
  {
    name: "submit",
    label: "Submit",
    icon: "check-circle",
    variant: "primary",
    confirmMessage: "Submit this record for approval?",
    category: "workflow",
  },
  {
    name: "approve",
    label: "Approve",
    icon: "thumbs-up",
    variant: "primary",
    confirmMessage: "Approve this record?",
    requiresSelection: true,
    category: "workflow",
  },
  {
    name: "reject",
    label: "Reject",
    icon: "thumbs-down",
    variant: "destructive",
    confirmMessage: "Reject this record?",
    requiresSelection: true,
    category: "workflow",
  },
  {
    name: "cancel",
    label: "Cancel",
    icon: "x-circle",
    variant: "destructive",
    confirmMessage: "Are you sure you want to cancel this record?",
    category: "lifecycle",
  },
  {
    name: "duplicate",
    label: "Duplicate",
    icon: "copy",
    variant: "secondary",
    category: "utility",
  },
  {
    name: "export",
    label: "Export to Excel",
    icon: "download",
    variant: "ghost",
    category: "report",
  },
  {
    name: "print",
    label: "Print",
    icon: "printer",
    variant: "ghost",
    category: "report",
  },
];

/**
 * Entity-specific action overrides.
 */
const ENTITY_ACTIONS: Record<string, string[]> = {
  SalesOrders: ["post", "submit", "approve", "cancel", "duplicate", "print"],
  PurchaseOrders: ["submit", "approve", "reject", "cancel", "print"],
  GeneralJournals: ["post", "export"],
  Customers: ["duplicate", "export"],
  Vendors: ["duplicate", "export"],
};

/**
 * Get actions applicable to a given entity set.
 */
export function getActionsForEntity(entitySet: string): ActionDefinition[] {
  const actionNames = ENTITY_ACTIONS[entitySet];
  if (!actionNames) {
    // Default: just utility + report actions
    return COMMON_ACTIONS.filter((a) => a.category === "utility" || a.category === "report");
  }
  return COMMON_ACTIONS.filter((a) => actionNames.includes(a.name));
}

/**
 * Get an action by name.
 */
export function getAction(name: string): ActionDefinition | undefined {
  return COMMON_ACTIONS.find((a) => a.name === name);
}
