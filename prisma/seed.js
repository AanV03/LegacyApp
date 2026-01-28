import bcrypt from "bcryptjs";
// Import the generated Prisma client directly to avoid issues when @prisma/client
// bootstrap hasn't initialized node_modules/.prisma/client.
// Import the generated prisma client entry file explicitly (ESM requires file path).
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  // Clean existing data (order matters due to relations)
  const delComments = await prisma.comment.deleteMany();
  const delNotifications = await prisma.notification.deleteMany();
  const delTasks = await prisma.task.deleteMany();
  const delProjects = await prisma.project.deleteMany();
  const delUsers = await prisma.user.deleteMany();

  console.log(`Database reset: deleted ${delComments.count} comments, ${delNotifications.count} notifications, ${delTasks.count} tasks, ${delProjects.count} projects, ${delUsers.count} users`);

  // Create users (one ADMIN + some USERS)
  const adminPassword = await bcrypt.hash("adminpass", 10);
  const userPassword = await bcrypt.hash("userpass", 10);

  const admin = await prisma.user.create({ data: { name: "Admin User", username: "admin", email: "admin@example.com", password: adminPassword, role: "ADMIN" } });
  const alice = await prisma.user.create({ data: { name: "Alice Garcia", username: "alice", email: "alice@example.com", password: userPassword } });
  const bob = await prisma.user.create({ data: { name: "Bob Martinez", username: "bob", email: "bob@example.com", password: userPassword } });
  const carla = await prisma.user.create({ data: { name: "Carla Ruiz", username: "carla", email: "carla@example.com", password: userPassword } });

  console.log(`Created users: ${[admin.email, alice.email, bob.email, carla.email].join(", ")}`);

  // Create projects
  const projectFrontend = await prisma.project.create({
    data: {
      name: "Website Frontend",
      description: "Revamp UI and components",
      createdById: admin.id,
    },
  });

  const projectAPI = await prisma.project.create({
    data: {
      name: "API and Auth",
      description: "Stabilize authentication and API endpoints",
      createdById: alice.id,
    },
  });

  console.log(`Created projects: ${projectFrontend.name}, ${projectAPI.name}`);

  // Create tasks
  const t1 = await prisma.task.create({
    data: {
      title: "Diseñar header",
      description: "Crear nuevo header responsivo",
      projectId: projectFrontend.id,
      createdById: admin.id,
      assignedToId: alice.id,
      status: "PENDING",
    },
  });

  const t2 = await prisma.task.create({
    data: {
      title: "Refactorizar botón",
      description: "Unificar estilos del botón primario",
      projectId: projectFrontend.id,
      createdById: admin.id,
      assignedToId: bob.id,
      status: "IN_PROGRESS",
    },
  });

  const t3 = await prisma.task.create({
    data: {
      title: "Implementar login JWT",
      description: "Agregar payload con role y refresco opcional",
      projectId: projectAPI.id,
      createdById: alice.id,
      assignedToId: carla.id,
      status: "PENDING",
    },
  });

  console.log(`Created tasks: ${t1.title}, ${t2.title}, ${t3.title}`);

  // Create comments
  await prisma.comment.create({
    data: {
      text: "Podemos usar el nuevo diseño de Figma",
      taskId: t1.id,
      userId: alice.id,
    },
  });

  await prisma.comment.create({
    data: {
      text: "Voy a abrir un PR con la propuesta",
      taskId: t2.id,
      userId: bob.id,
    },
  });

  console.log("Created comments for tasks.");

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: alice.id,
      message: "Se te asignó la tarea 'Diseñar header'",
      type: "TASK_ASSIGNED",
    },
  });

  await prisma.notification.create({
    data: {
      userId: bob.id,
      message: "Nueva tarea: 'Refactorizar botón'",
      type: "TASK_CREATED",
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      message: "Proyecto 'API and Auth' creado",
      type: "PROJECT_CREATED",
    },
  });

  console.log("Created notifications for users.");

  console.log("Seeding finished. Summary:\n", {
    users: [admin.email, alice.email, bob.email, carla.email],
    projects: [projectFrontend.name, projectAPI.name],
    tasks: [t1.title, t2.title, t3.title],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
