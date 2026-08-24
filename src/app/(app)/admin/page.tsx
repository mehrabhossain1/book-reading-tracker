import type { Metadata } from "next";
import type { IconType } from "react-icons";
import {
  RiBook2Fill,
  RiFileList3Fill,
  RiGroupFill,
  RiShieldUserFill,
  RiUserForbidFill,
} from "react-icons/ri";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, formatRelative, plural } from "@/lib/format";
import { requireStaff } from "@/lib/session";
import { UserRowActions } from "@/modules/admin/components/user-row-actions";
import { ROLE_LABELS, isSuperAdmin, toRole } from "@/modules/admin/permissions";
import { getPlatformMetrics, listPlatformUsers } from "@/modules/admin/queries";

export const metadata: Metadata = { title: "Admin" };

function Metric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: IconType;
}) {
  return (
    <div className="bg-card border-border rounded-2xl border p-4">
      <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="tabular mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
      {hint && <p className="text-muted-foreground/70 mt-1 text-[0.6875rem]">{hint}</p>}
    </div>
  );
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const viewer = await requireStaff();
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : undefined;

  const [metrics, { users, total }] = await Promise.all([
    getPlatformMetrics(),
    listPlatformUsers({ search }),
  ]);

  const canManageStaff = isSuperAdmin(viewer.role);
  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Admin"
        description={`Signed in as ${ROLE_LABELS[toRole(viewer.role)].toLowerCase()}.`}
      />

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Metric
          label="Accounts"
          value={metrics.totalUsers}
          hint={`+${metrics.newUsersThisWeek} this week`}
          icon={RiGroupFill}
        />
        <Metric label="Staff" value={metrics.staff} icon={RiShieldUserFill} />
        <Metric label="Banned" value={metrics.banned} icon={RiUserForbidFill} />
        <Metric
          label="Books"
          value={metrics.totalBooks}
          hint={`${metrics.activeBooks} being read`}
          icon={RiBook2Fill}
        />
        <Metric
          label="Pages logged"
          value={metrics.pagesLogged}
          hint={plural(metrics.totalSessions, "session")}
          icon={RiFileList3Fill}
        />
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">
            Accounts <span className="text-muted-foreground tabular">({total})</span>
          </h2>
          {/* A plain GET form: search survives a refresh and is linkable. */}
          <form className="w-full sm:w-64">
            <Input
              type="search"
              name="q"
              defaultValue={search ?? ""}
              placeholder="Search name or email"
              aria-label="Search accounts"
            />
          </form>
        </div>

        {users.length === 0 ? (
          <p className="text-muted-foreground border-border mt-4 rounded-xl border border-dashed px-4 py-10 text-center text-sm">
            No accounts match “{search}”.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {users.map((row) => {
              const role = toRole(row.role);
              const isSelf = row.id === viewer.id;
              const banned = Boolean(row.banned);

              return (
                <li
                  key={row.id}
                  className="bg-card border-border flex flex-wrap items-center gap-3 rounded-xl border p-3.5"
                >
                  <Avatar className="size-9">
                    {row.image ? <AvatarImage src={row.image} alt="" /> : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {row.name.trim().slice(0, 1).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{row.name}</p>
                      {role !== "user" && (
                        <Badge variant="secondary" className="gap-1">
                          <RiShieldUserFill className="size-3" />
                          {ROLE_LABELS[role]}
                        </Badge>
                      )}
                      {isSelf && <Badge variant="outline">You</Badge>}
                      {banned && <Badge variant="destructive">Banned</Badge>}
                    </div>
                    <p className="text-muted-foreground truncate text-sm">{row.email}</p>
                    {banned && row.banReason && (
                      <p className="text-destructive mt-0.5 truncate text-xs">
                        {row.banReason}
                        {row.banExpires ? ` · until ${formatDate(row.banExpires)}` : " · indefinite"}
                      </p>
                    )}
                  </div>

                  <dl className="text-muted-foreground hidden gap-6 text-xs sm:flex">
                    <div>
                      <dt className="text-[0.6875rem] tracking-wide uppercase">Books</dt>
                      <dd className="text-foreground tabular mt-0.5 font-medium">
                        {row.bookCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.6875rem] tracking-wide uppercase">Pages</dt>
                      <dd className="text-foreground tabular mt-0.5 font-medium">
                        {row.pagesLogged}
                      </dd>
                    </div>
                    <div className="hidden lg:block">
                      <dt className="text-[0.6875rem] tracking-wide uppercase">Last read</dt>
                      <dd className="text-foreground mt-0.5 font-medium">
                        {row.lastReadAt ? formatRelative(row.lastReadAt, now) : "never"}
                      </dd>
                    </div>
                    <div className="hidden xl:block">
                      <dt className="text-[0.6875rem] tracking-wide uppercase">Joined</dt>
                      <dd className="text-foreground mt-0.5 font-medium">
                        {formatDate(row.createdAt)}
                      </dd>
                    </div>
                  </dl>

                  <UserRowActions
                    userId={row.id}
                    name={row.name}
                    role={row.role}
                    banned={banned}
                    isSelf={isSelf}
                    viewerIsSuperAdmin={canManageStaff}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
