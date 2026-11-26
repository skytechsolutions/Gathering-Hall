import { Role, OwnerStatus } from "@prisma/client";

export { Role, OwnerStatus };

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: OwnerStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  status: OwnerStatus;
}
