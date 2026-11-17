import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Flag,
  Megaphone,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  SemanticStatusText,
  UserAvatar,
} from '@/src/components/shared/KuriBrand';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/controls';
import { Input, Textarea } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/primitives';
import { DEMO_GROUP_IMAGES } from '@/src/lib/seedData';
import { useKuri } from '@/src/lib/store';
import { formatDate, formatINR } from '@/src/lib/utils';
import type {
  ContributionFrequency,
  GroupVisibility,
  SavingsPurpose,
} from '@/src/types/kuri';

const PURPOSES: SavingsPurpose[] = [
  'Community development',
  'Education',
  'Medical emergencies',
  'Weddings',
  'Small business development',
  'Family savings',
];

export const MyGroupsPage: React.FC = () => {
  const {
    db,
    currentUser,
    navigate,
    searchQuery,
    joinGroupByCode,
    getGroupTotalSaved,
    getVisibleGroupsForUser,
  } = useKuri();

  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'my' | 'directory'>('my');

  const myGroups = useMemo(
    () => getVisibleGroupsForUser(currentUser),
    [db.groups, db.groupMembers, currentUser]
  );

  const directoryGroups = useMemo(() => {
    const myIds = new Set(myGroups.map((g) => g.id));
    return db.groups.filter(
      (g) => g.visibility === 'community_directory' && !myIds.has(g.id)
    );
  }, [db.groups, myGroups]);

  const list = (filterMode === 'my' ? myGroups : directoryGroups).filter(
    (g) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        g.purpose.toLowerCase().includes(q) ||
        g.inviteCode.toLowerCase().includes(q)
      );
    }
  );

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const res = joinGroupByCode(inviteCodeInput);
    if (!res.ok) {
      setJoinError(res.error || 'Could not join group');
      return;
    }
    setInviteCodeInput('');
    setJoinOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setFilterMode('my')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'my'
                ? 'bg-[#1F1F1F] text-white'
                : 'text-[#7A7A7A] hover:text-[#1F1F1F]'
            }`}
          >
            My Circles ({myGroups.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('directory')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'directory'
                ? 'bg-[#1F1F1F] text-white'
                : 'text-[#7A7A7A] hover:text-[#1F1F1F]'
            }`}
          >
            Community Directory ({directoryGroups.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Join via Invite Code</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Community Savings Circle</DialogTitle>
                <DialogDescription>
                  Enter the unique group invitation code shared by your organizer
                  (for example: KURI-GRN-2026 or KURI-ART-8820).
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-code">Invitation Code</Label>
                  <Input
                    id="invite-code"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    placeholder="KURI-GRN-2026"
                    className="font-mono uppercase"
                    required
                  />
                </div>
                {joinError && (
                  <p className="rounded-xl bg-[#FEE2E2] px-3 py-2 text-xs text-[#B91C1C]">
                    {joinError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setJoinOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Submit Join Request</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {(currentUser?.role === 'organizer' ||
            currentUser?.role === 'platform_admin') && (
            <Button onClick={() => navigate('create-group')} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Savings Group</span>
            </Button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <p className="font-display text-base font-semibold text-[#1F1F1F]">
            No matching savings groups found
          </p>
          <p className="text-sm text-[#7A7A7A] max-w-md mx-auto">
            {filterMode === 'my'
              ? 'Join an existing group using an invitation code or create a new goal-based group.'
              : 'All public community directory groups are already in your circles.'}
          </p>
          <Button variant="outline" onClick={() => setJoinOpen(true)}>
            Join with Invitation Code
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((group) => {
            const saved = getGroupTotalSaved(group.id);
            const pct = Math.min(
              100,
              Math.round((saved / group.targetAmount) * 100)
            );
            const activeMembersCount = db.groupMembers.filter(
              (gm) => gm.groupId === group.id && gm.status === 'active'
            ).length;
            const myMembership = db.groupMembers.find(
              (gm) => gm.groupId === group.id && gm.userId === currentUser?.id
            );

            return (
              <Card
                key={group.id}
                className="overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="relative h-40 w-full bg-[#E8F0ED] overflow-hidden">
                    <img
                      src={group.imageUrl || DEMO_GROUP_IMAGES.greenfield}
                      alt={group.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <p className="text-[11px] text-white/80">
                          {group.purpose} · Goal-Based Pool
                        </p>
                        <h3 className="font-display text-base font-bold leading-snug">
                          {group.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    <p className="text-xs leading-relaxed text-[#555555] line-clamp-2">
                      {group.description}
                    </p>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="font-semibold text-[#0E5A46]">
                          {formatINR(saved)} simulated
                        </span>
                        <span className="text-[#7A7A7A]">
                          Goal {formatINR(group.targetAmount)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#ECEAE3] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0E5A46] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EDE6] text-xs">
                      <div>
                        <p className="text-[11px] text-[#7A7A7A]">Members</p>
                        <p className="font-semibold text-[#1F1F1F] tabular-nums">
                          {activeMembersCount}/{group.maxMembers}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#7A7A7A]">Cycle</p>
                        <p className="font-semibold text-[#1F1F1F] capitalize tabular-nums">
                          {formatINR(group.proposedContribution)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#7A7A7A]">Code</p>
                        <p className="font-mono text-[11px] font-semibold text-[#0E5A46] truncate">
                          {group.inviteCode}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="px-5 pb-5 pt-0 flex items-center justify-between gap-2">
                  {filterMode === 'my' || myMembership?.status === 'active' ? (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() =>
                        navigate('group-details', { groupId: group.id })
                      }
                    >
                      Open Circle Workspace
                    </Button>
                  ) : myMembership?.status === 'pending' ? (
                    <Button className="w-full" size="sm" variant="secondary" disabled>
                      Approval Pending
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={() => joinGroupByCode(group.inviteCode)}
                    >
                      Request to Join
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CreateGroupPage: React.FC = () => {
  const { currentUser, createGroup, navigate } = useKuri();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState<SavingsPurpose>('Community development');
  const [imageUrl, setImageUrl] = useState(DEMO_GROUP_IMAGES.greenfield);
  const [maxMembers, setMaxMembers] = useState('10');
  const [targetAmount, setTargetAmount] = useState('100000');
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [proposedContribution, setProposedContribution] = useState('1000');
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2027-09-30');
  const [visibility, setVisibility] = useState<GroupVisibility>('private_invite');
  const [rules, setRules] = useState(
    '1. Simulated contributions are logged by the 10th of each cycle.\n2. Every record is anchored to the SHA-256 audit log.\n3. Discrepancies may be raised anytime in the Dispute Center.'
  );
  const [confirmedNotChitFund, setConfirmedNotChitFund] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (
    currentUser?.role !== 'organizer' &&
    currentUser?.role !== 'platform_admin'
  ) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="font-display text-lg font-semibold text-[#1F1F1F]">
          Organizer Privileges Required
        </p>
        <p className="text-sm text-[#7A7A7A]">
          Switch to the Group Organizer demo account or register as an organizer
          to create new savings groups.
        </p>
        <Button variant="outline" onClick={() => navigate('groups')}>
          Back to Groups
        </Button>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = createGroup({
      name,
      description,
      purpose,
      imageUrl,
      maxMembers: Number(maxMembers),
      targetAmount: Number(targetAmount),
      frequency,
      proposedContribution: Number(proposedContribution),
      startDate,
      endDate,
      rules,
      visibility,
      confirmedNotChitFund,
    });
    if (!res.ok) {
      setError(res.error || 'Could not create savings group');
      return;
    }
    navigate('group-details', { groupId: res.groupId });
  };

  return (
    <div className="max-w-4xl space-y-5">
      <button
        type="button"
        onClick={() => navigate('groups')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#555555] hover:text-[#1F1F1F] cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Savings Groups</span>
      </button>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-[#1F1F1F]">
              Configure Goal-Based Savings Group
            </h2>
            <p className="text-xs text-[#7A7A7A]">
              Creates a simulated community coordination pool and generates a
              unique invitation code.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="grp-name">Group Name</Label>
              <Input
                id="grp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Palakkad Farmers Solar Reserve"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Savings Purpose</Label>
              <Select
                value={purpose}
                onValueChange={(v) => setPurpose(v as SavingsPurpose)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grp-desc">Description</Label>
            <Textarea
              id="grp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the community savings goal and how records will be tracked..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="grp-max">Max Members</Label>
              <Input
                id="grp-max"
                type="number"
                min={2}
                max={50}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grp-target">Target Amount (₹)</Label>
              <Input
                id="grp-target"
                type="number"
                min={1000}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as ContributionFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grp-contrib">Proposed Contribution (₹)</Label>
              <Input
                id="grp-contrib"
                type="number"
                min={100}
                value={proposedContribution}
                onChange={(e) => setProposedContribution(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="grp-start">Proposed Start Date</Label>
              <Input
                id="grp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grp-end">Proposed End Date</Label>
              <Input
                id="grp-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Visibility Setting</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as GroupVisibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private_invite">
                    Private (Invite Code Only)
                  </SelectItem>
                  <SelectItem value="community_directory">
                    Community Directory
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Group Cover Image</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Community Courtyard', url: DEMO_GROUP_IMAGES.greenfield },
                { label: 'Education Ledger', url: DEMO_GROUP_IMAGES.education },
                { label: 'Cooperative Table', url: DEMO_GROUP_IMAGES.hero },
              ].map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className={`overflow-hidden rounded-xl border-2 text-left transition-all cursor-pointer ${
                    imageUrl === img.url
                      ? 'border-[#0E5A46]'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    referrerPolicy="no-referrer"
                    className="h-20 w-full object-cover"
                  />
                  <p className="px-2 py-1.5 text-[11px] font-medium bg-[#F8F6F2] text-[#1F1F1F] truncate">
                    {img.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grp-rules">Group Rules & Governance</Label>
            <Textarea
              id="grp-rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Mandatory Distinction Notice */}
          <div className="rounded-2xl bg-[#F8F6F2] p-4 border border-[#E7E4DC] space-y-2.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#0E5A46] mt-0.5 shrink-0" />
              <div className="text-xs text-[#555555] space-y-1">
                <p className="font-semibold text-[#1F1F1F]">
                  Goal-Based Coordination vs Regulated Rotating Chit Arrangement
                </p>
                <p>
                  KuriCircle groups track simulated goal-based community savings
                  milestones only. They do not conduct rotating prize draws,
                  collect real deposits, or operate under chit fund statutes.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-xs font-medium text-[#1F1F1F] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={confirmedNotChitFund}
                onChange={(e) => setConfirmedNotChitFund(e.target.checked)}
                className="h-4 w-4 rounded accent-[#0E5A46]"
              />
              <span>
                I confirm this group is a simulated goal-based coordination
                demonstration and not a regulated rotating chit fund.
              </span>
            </label>
          </div>

          {error && (
            <p className="rounded-xl bg-[#FEE2E2] px-3.5 py-2.5 text-xs font-medium text-[#B91C1C]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('groups')}
            >
              Cancel
            </Button>
            <Button type="submit">Create Group & Generate Invite Code</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const GroupDetailsPage: React.FC = () => {
  const {
    db,
    currentUser,
    selectedGroupId,
    navigate,
    getGroupTotalSaved,
    getGroupPendingTotal,
    getGroupMembersList,
    handleMembershipRequest,
    inviteMemberByEmail,
    postAnnouncement,
    toggleGroupFlag,
  } = useKuri();

  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const group =
    db.groups.find((g) => g.id === selectedGroupId) ?? db.groups[0] ?? null;

  if (!group || !currentUser) return null;

  // Enforce group access policy
  const isMemberOrOrganizer =
    currentUser.role === 'platform_admin' ||
    group.organizerId === currentUser.id ||
    db.groupMembers.some(
      (gm) =>
        gm.groupId === group.id &&
        gm.userId === currentUser.id &&
        gm.status === 'active'
    );

  if (!isMemberOrOrganizer) {
    return (
      <Card className="p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-[#9A6B16] mx-auto" />
        <h2 className="font-display text-lg font-bold text-[#1F1F1F]">
          Private Group Access Restricted
        </h2>
        <p className="text-sm text-[#7A7A7A] max-w-md mx-auto">
          Row-level access policies prevent viewing private group details
          unless you are an approved active member or organizer.
        </p>
        <Button onClick={() => navigate('groups')}>Return to My Groups</Button>
      </Card>
    );
  }

  const isOrganizer =
    group.organizerId === currentUser.id || currentUser.role === 'platform_admin';

  const saved = getGroupTotalSaved(group.id);
  const pending = getGroupPendingTotal(group.id);
  const remaining = Math.max(0, group.targetAmount - saved);
  const pct = Math.min(100, Math.round((saved / group.targetAmount) * 100));

  const membersList = getGroupMembersList(group.id);
  const activeMembers = membersList.filter((m) => m.membership.status === 'active');
  const pendingRequests = membersList.filter(
    (m) => m.membership.status === 'pending'
  );
  const announcements = db.announcements.filter((a) => a.groupId === group.id);
  const groupContribs = db.contributions
    .filter((c) => c.groupId === group.id)
    .slice(0, 6);

  const copyCode = () => {
    navigator.clipboard?.writeText(group.inviteCode);
    setCopied(true);
    toast.success(`Copied invite code ${group.inviteCode}`);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = inviteMemberByEmail(group.id, inviteEmail);
    if (res.ok) setInviteEmail('');
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    postAnnouncement(group.id, annTitle, annBody);
    setAnnTitle('');
    setAnnBody('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('groups')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#555555] hover:text-[#1F1F1F] cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Savings Groups</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {isOrganizer && (
            <Button
              size="sm"
              variant={group.isFlagged ? 'destructive' : 'outline'}
              onClick={() => toggleGroupFlag(group.id, 'Organizer review flag')}
              className="gap-1.5"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>{group.isFlagged ? 'Flagged for Review' : 'Flag Activity'}</span>
            </Button>
          )}
          <Button size="sm" onClick={() => navigate('contributions')}>
            Record / View Contributions
          </Button>
        </div>
      </div>

      {/* Header Banner Card */}
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-12">
          <div className="lg:col-span-5 h-56 lg:h-auto bg-[#E8F0ED]">
            <img
              src={group.imageUrl || DEMO_GROUP_IMAGES.greenfield}
              alt={group.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="lg:col-span-7 p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#0E5A46]">
                  {group.purpose} · Goal-Based Coordination Pool (Simulated)
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-[#1F1F1F]">
                  {group.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F8F6F2] px-3 py-2 text-xs font-mono font-semibold text-[#0E5A46] hover:bg-[#E8F0ED] transition-colors cursor-pointer"
              >
                <span>{group.inviteCode}</span>
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <p className="text-sm text-[#555555] leading-relaxed">
              {group.description}
            </p>

            {/* Goal Progress & Milestones */}
            <div className="rounded-2xl bg-[#F8F6F2] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#1F1F1F]">
                  Simulated Savings Goal Progress
                </span>
                <span className="font-display font-bold text-[#0E5A46] tabular-nums">
                  {formatINR(saved)} / {formatINR(group.targetAmount)} ({pct}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#E2DFD7] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0E5A46] transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#7A7A7A] tabular-nums">
                <span>Remaining: {formatINR(remaining)}</span>
                <span>Pending verification: {formatINR(pending)}</span>
                <span>Target date: {formatDate(group.endDate)}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[25, 50, 75, 100].map((m) => (
                  <div
                    key={m}
                    className={`rounded-lg px-2 py-1 text-center text-[11px] font-medium tabular-nums ${
                      pct >= m
                        ? 'bg-[#0E5A46] text-white'
                        : 'bg-white text-[#7A7A7A]'
                    }`}
                  >
                    {m}% Milestone
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Members & Requests */}
        <Card className="lg:col-span-7 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0E5A46]" />
              <h3 className="font-display text-base font-semibold text-[#1F1F1F]">
                Members ({activeMembers.length}/{group.maxMembers})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('members')}
              className="text-xs font-medium text-[#0E5A46] hover:underline cursor-pointer"
            >
              Manage Directory
            </button>
          </div>

          {isOrganizer && pendingRequests.length > 0 && (
            <div className="rounded-2xl bg-[#F7F0DF]/70 p-4 space-y-3">
              <p className="text-xs font-semibold text-[#9A6B16]">
                Pending Membership Requests ({pendingRequests.length})
              </p>
              {pendingRequests.map(({ membership, profile }) => (
                <div
                  key={membership.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      name={profile.fullName}
                      src={profile.avatarUrl}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#1F1F1F]">
                        {profile.fullName}
                      </p>
                      <p className="text-[11px] text-[#7A7A7A]">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleMembershipRequest(membership.id, 'active')
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleMembershipRequest(membership.id, 'rejected')
                      }
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="divide-y divide-[#F0EDE6]">
            {activeMembers.map(({ membership, profile, totalVerified, totalPending }) => (
              <div
                key={membership.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={profile.fullName}
                    src={profile.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1F1F1F] truncate">
                      {profile.fullName}
                      {group.organizerId === profile.id && (
                        <span className="ml-1.5 text-[11px] font-medium text-[#0E5A46]">
                          · Organizer
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#7A7A7A] truncate">
                      {profile.city}
                    </p>
                  </div>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <p className="text-xs font-bold text-[#1F1F1F]">
                    {formatINR(totalVerified)}
                  </p>
                  <p className="text-[11px] text-[#7A7A7A]">
                    {totalPending > 0
                      ? `${formatINR(totalPending)} pending`
                      : 'Verified'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {isOrganizer && (
            <form
              onSubmit={handleInviteSubmit}
              className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#ECEAE3]"
            >
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite member by email..."
                required
              />
              <Button type="submit" size="sm" className="shrink-0">
                Send Invite Code
              </Button>
            </form>
          )}
        </Card>

        {/* Rules, Announcements & Recent Activity */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#0E5A46]" />
              <h3 className="font-display text-base font-semibold text-[#1F1F1F]">
                Group Announcements
              </h3>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {announcements.length === 0 ? (
                <p className="text-xs text-[#7A7A7A]">
                  No announcements posted yet.
                </p>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl bg-[#F8F6F2] p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#1F1F1F]">
                        {a.title}
                      </p>
                      <span className="text-[10px] text-[#7A7A7A] shrink-0">
                        {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#555555] leading-relaxed">
                      {a.body}
                    </p>
                  </div>
                ))
              )}
            </div>
            {isOrganizer && (
              <form
                onSubmit={handleAnnouncementSubmit}
                className="space-y-2 pt-2 border-t border-[#ECEAE3]"
              >
                <Input
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Announcement title..."
                  className="h-9 text-xs"
                  required
                />
                <Textarea
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  placeholder="Share cycle reminders or updates..."
                  className="min-h-[64px] text-xs"
                  required
                />
                <Button type="submit" size="sm" className="w-full">
                  Publish Announcement
                </Button>
              </form>
            )}
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-display text-base font-semibold text-[#1F1F1F]">
              Group Rules & Schedule
            </h3>
            <p className="text-xs whitespace-pre-line leading-relaxed text-[#555555]">
              {group.rules}
            </p>
            <div className="pt-2 border-t border-[#ECEAE3] space-y-2">
              <p className="text-xs font-semibold text-[#1F1F1F]">
                Recent Simulated Activity
              </p>
              {groupContribs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-[#555555]">
                    {c.transactionId}
                  </span>
                  <SemanticStatusText status={c.paymentStatus} />
                  <span className="font-semibold tabular-nums">
                    {formatINR(c.amount)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
