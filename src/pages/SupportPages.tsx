import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquareWarning,
  Plus,
  RotateCcw,
  Send,
} from 'lucide-react';
import {
  SemanticStatusText,
  UserAvatar,
} from '@/src/components/shared/KuriBrand';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/controls';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import { Input, Textarea } from '@/src/components/ui/input';
import { Label, Switch } from '@/src/components/ui/primitives';
import { DEMO_AVATARS } from '@/src/lib/seedData';
import { useKuri } from '@/src/lib/store';
import { formatDateTime } from '@/src/lib/utils';
import type { DisputeCategory, DisputeStatus } from '@/src/types/kuri';

export const NotificationsPage: React.FC = () => {
  const {
    db,
    currentUser,
    markNotificationRead,
    markAllNotificationsRead,
    navigate,
  } = useKuri();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const items = useMemo(() => {
    if (!currentUser) return [];
    return db.notifications
      .filter((n) => n.userId === currentUser.id)
      .filter((n) => (filter === 'unread' ? !n.isRead : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db.notifications, currentUser, filter]);

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium cursor-pointer ${
              filter === 'all' ? 'bg-[#1F1F1F] text-white' : 'text-[#7A7A7A]'
            }`}
          >
            All Notifications
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium cursor-pointer ${
              filter === 'unread' ? 'bg-[#1F1F1F] text-white' : 'text-[#7A7A7A]'
            }`}
          >
            Unread
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={markAllNotificationsRead}
          className="gap-1.5"
        >
          <CheckCheck className="h-4 w-4" />
          <span>Mark All Read</span>
        </Button>
      </div>

      <Card className="divide-y divide-[#F0EDE6]">
        {items.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Bell className="h-6 w-6 text-[#7A7A7A] mx-auto" />
            <p className="font-display text-sm font-semibold text-[#1F1F1F]">
              No notifications in this view
            </p>
            <p className="text-xs text-[#7A7A7A]">
              Cycle reminders, approvals, and dispute updates will appear here.
            </p>
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                !n.isRead ? 'bg-[#E8F0ED]/35' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#0E5A46] capitalize">
                    {n.category}
                  </span>
                  <span aria-hidden="true" className="text-[#C8A45A]">·</span>
                  <span className="text-[#7A7A7A] tabular-nums">
                    {formatDateTime(n.createdAt)}
                  </span>
                  {!n.isRead && (
                    <span className="text-[11px] font-semibold text-[#9A6B16]">
                      · Unread
                    </span>
                  )}
                </div>
                <p className="font-display text-sm font-semibold text-[#1F1F1F]">
                  {n.title}
                </p>
                <p className="text-xs text-[#555555]">{n.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {n.groupId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      navigate('group-details', { groupId: n.groupId })
                    }
                  >
                    View Group
                  </Button>
                )}
                {!n.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markNotificationRead(n.id)}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

const DISPUTE_CATEGORIES: DisputeCategory[] = [
  'Missing contribution record',
  'Incorrect amount',
  'Incorrect transaction date',
  'Unauthorized record change',
  'Other discrepancy',
];

export const DisputesPage: React.FC = () => {
  const {
    db,
    currentUser,
    getVisibleGroupsForUser,
    submitDispute,
    respondDispute,
  } = useKuri();

  const visibleGroups = useMemo(
    () => getVisibleGroupsForUser(currentUser),
    [db.groups, db.groupMembers, currentUser]
  );

  const [openModal, setOpenModal] = useState(false);
  const [groupId, setGroupId] = useState(visibleGroups[0]?.id ?? 'grp-greenfield');
  const [category, setCategory] = useState<DisputeCategory>('Missing contribution record');
  const [contributionId, setContributionId] = useState('none');
  const [description, setDescription] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const visibleGroupIds = new Set(visibleGroups.map((g) => g.id));

  const visibleDisputes = useMemo(() => {
    return db.disputes
      .filter((d) =>
        currentUser?.role === 'platform_admin'
          ? true
          : visibleGroupIds.has(d.groupId)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [db.disputes, currentUser, visibleGroups]);

  const groupContribs = useMemo(
    () => db.contributions.filter((c) => c.groupId === groupId),
    [db.contributions, groupId]
  );

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    await submitDispute({
      groupId,
      contributionId: contributionId === 'none' ? undefined : contributionId,
      category,
      description,
    });
    setDescription('');
    setContributionId('none');
    setOpenModal(false);
  };

  const handleReply = async (
    disputeId: string,
    nextStatus?: DisputeStatus,
    actionLabel?: string
  ) => {
    const msg = replyText[disputeId]?.trim() || actionLabel || 'Status updated';
    await respondDispute(disputeId, msg, nextStatus, actionLabel);
    setReplyText((prev) => ({ ...prev, [disputeId]: '' }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#555555]">
          <MessageSquareWarning className="h-4 w-4 text-[#0E5A46]" />
          <span>
            Every dispute filing, organizer response, and escalation is logged in
            the SHA-256 audit ledger.
          </span>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Report Discrepancy</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File a Record Discrepancy</DialogTitle>
              <DialogDescription>
                Report missing contributions, incorrect amounts, or date issues for
                organizer and administrator review.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitDispute} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Savings Group</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Discrepancy Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as DisputeCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPUTE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Related Transaction (Optional)</Label>
                <Select value={contributionId} onValueChange={setContributionId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific transaction ID</SelectItem>
                    {groupContribs.slice(0, 15).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.transactionId} · {c.contributionPeriod} (₹{c.amount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dsp-desc">Details</Label>
                <Textarea
                  id="dsp-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the discrepancy clearly..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Dispute</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {visibleDisputes.map((d) => {
          const group = db.groups.find((g) => g.id === d.groupId);
          const reporter = db.profiles.find((p) => p.id === d.reportedBy);
          const responses = db.disputeResponses.filter(
            (r) => r.disputeId === d.id
          );
          const canManage =
            currentUser?.role === 'platform_admin' ||
            group?.organizerId === currentUser?.id;

          return (
            <Card key={d.id} className="p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#7A7A7A]">
                    <span className="font-mono font-semibold text-[#0E5A46]">
                      {d.id.toUpperCase()}
                    </span>
                    <span>·</span>
                    <span>{group?.name}</span>
                    <span>·</span>
                    <span>Reported by {reporter?.fullName}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#1F1F1F]">
                    {d.category}
                  </h3>
                </div>
                <SemanticStatusText status={d.status} />
              </div>

              <p className="text-sm text-[#555555] leading-relaxed">
                {d.description}
              </p>

              {responses.length > 0 && (
                <div className="space-y-2 rounded-2xl bg-[#F8F6F2] p-4">
                  <p className="text-xs font-semibold text-[#1F1F1F]">
                    Resolution Thread
                  </p>
                  {responses.map((r) => {
                    const responder = db.profiles.find(
                      (p) => p.id === r.responderId
                    );
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl bg-white p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[#7A7A7A]">
                          <span className="font-semibold text-[#1F1F1F]">
                            {responder?.fullName}{' '}
                            {r.actionTaken ? `· ${r.actionTaken}` : ''}
                          </span>
                          <span className="tabular-nums">
                            {formatDateTime(r.createdAt)}
                          </span>
                        </div>
                        <p className="text-[#555555]">{r.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {d.status !== 'resolved' && d.status !== 'dismissed' && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#ECEAE3]">
                  <Input
                    value={replyText[d.id] ?? ''}
                    onChange={(e) =>
                      setReplyText((prev) => ({
                        ...prev,
                        [d.id]: e.target.value,
                      }))
                    }
                    placeholder="Add response or clarification note..."
                    className="text-xs"
                  />
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReply(d.id, 'under_review', 'Commented')}
                      className="gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Reply</span>
                    </Button>
                    {canManage && d.status !== 'escalated' && (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() =>
                          handleReply(d.id, 'escalated', 'Escalated to Admin')
                        }
                      >
                        Escalate
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleReply(d.id, 'resolved', 'Resolved')
                        }
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useKuri();
  const [fullName, setFullName] = useState(currentUser?.fullName ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [city, setCity] = useState(currentUser?.city ?? '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl ?? '');

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, phone, city, avatarUrl });
  };

  return (
    <div className="max-w-2xl space-y-5">
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <UserAvatar name={fullName || currentUser.fullName} src={avatarUrl} size="xl" />
          <div>
            <h2 className="font-display text-xl font-bold text-[#1F1F1F]">
              {currentUser.fullName}
            </h2>
            <p className="text-xs text-[#7A7A7A]">{currentUser.email}</p>
            <p className="mt-1 text-xs font-semibold text-[#0E5A46] capitalize">
              Role: {currentUser.role.replace('_', ' ')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prof-name">Full Name</Label>
              <Input
                id="prof-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-phone">Phone Number</Label>
              <Input
                id="prof-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-city">City / Community</Label>
            <Input
              id="prof-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Profile Portrait Preset</Label>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Organizer Portrait', url: DEMO_AVATARS.organizer },
                { label: 'Member Portrait', url: DEMO_AVATARS.member },
                { label: 'Initials Monogram', url: '' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setAvatarUrl(opt.url)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer ${
                    avatarUrl === opt.url
                      ? 'border-[#0E5A46] bg-[#E8F0ED] text-[#0E5A46]'
                      : 'border-[#E2DFD7] bg-white text-[#555555]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit">Save Profile Changes</Button>
        </form>
      </Card>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { notifPrefs, setNotifPrefs, resetDemoEnvironment } = useKuri();

  return (
    <div className="max-w-2xl space-y-5">
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold text-[#1F1F1F]">
            Notification Preferences
          </h2>
          <p className="text-xs text-[#7A7A7A]">
            Choose which simulated community updates appear in your alert center.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              key: 'upcomingReminders' as const,
              title: 'Upcoming Contribution Reminders',
              desc: 'Alerts before monthly or weekly simulated cycle dates',
            },
            {
              key: 'contributionUpdates' as const,
              title: 'Verification & Receipt Updates',
              desc: 'Notifications when organizers verify or reject records',
            },
            {
              key: 'groupAnnouncements' as const,
              title: 'Group Announcements',
              desc: 'Updates published by circle organizers',
            },
            {
              key: 'disputeAlerts' as const,
              title: 'Dispute & Escalation Alerts',
              desc: 'Real-time updates when discrepancy threads change status',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8F6F2] p-4"
            >
              <div>
                <p className="text-sm font-semibold text-[#1F1F1F]">
                  {item.title}
                </p>
                <p className="text-xs text-[#7A7A7A]">{item.desc}</p>
              </div>
              <Switch
                checked={notifPrefs[item.key]}
                onCheckedChange={(v) =>
                  setNotifPrefs({ ...notifPrefs, [item.key]: v })
                }
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h3 className="font-display text-base font-semibold text-[#1F1F1F]">
          Demonstration Environment Controls
        </h3>
        <p className="text-xs text-[#7A7A7A] leading-relaxed">
          Reset all groups, contributions, disputes, and audit events back to a
          clean zero baseline.
        </p>
        <Button
          variant="outline"
          onClick={resetDemoEnvironment}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset All Data to Zero</span>
        </Button>
      </Card>
    </div>
  );
};
