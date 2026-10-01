import { z } from "zod";
import { ADMIN_ROLES } from "@/lib/admin/roles";

export const setTeamRoleSchema = z.object({
  role: z.enum([...ADMIN_ROLES, "customer"]),
});
