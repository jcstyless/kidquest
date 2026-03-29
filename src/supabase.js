// src/supabase.js
// ═══════════════════════════════════════════════════════════
// KIDQUEST — Supabase client + auth helpers
// ═══════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yyzyyyitgvjcdeuqyzmq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5enl5eWl0Z3ZqY2RldXF5em1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDY5ODEsImV4cCI6MjA5MDM4Mjk4MX0.BNCwvk51NmMOdiC3hR3dolIssM-F_b7jtlH40xtvx1Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── AUTH ──────────────────────────────────────────────────

export async function signUp({ email, password, name, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } }
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ── PROFILE ───────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── TASK PROGRESS ─────────────────────────────────────────

export async function getTaskProgress(userId) {
  const { data, error } = await supabase
    .from('task_progress')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

export async function upsertTaskProgress(userId, taskId, taskTitle, updates) {
  const { data, error } = await supabase
    .from('task_progress')
    .upsert({
      user_id: userId,
      task_id: taskId,
      task_title: taskTitle,
      ...updates,
      completed_at: updates.status === 'approved' ? new Date().toISOString() : null
    }, { onConflict: 'user_id,task_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── INVENTORY ─────────────────────────────────────────────

export async function getInventory(userId) {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .order('obtained_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addInventoryItem(userId, item) {
  const { data, error } = await supabase
    .from('inventory')
    .insert({
      user_id: userId,
      item_id: item.id,
      item_type: item.type,
      item_name: item.name,
      rarity: item.rarity,
      svg_key: item.svgKey || item.id,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── SPEND LOG ─────────────────────────────────────────────

export async function getSpendLog(userId) {
  const { data, error } = await supabase
    .from('spend_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

export async function addSpendEntry(userId, { amount, category, note }) {
  const { data, error } = await supabase
    .from('spend_log')
    .insert({ user_id: userId, amount, category, note })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSpendEntry(entryId) {
  const { error } = await supabase
    .from('spend_log')
    .delete()
    .eq('id', entryId)
  if (error) throw error
}

// ── CUSTOM TASKS ──────────────────────────────────────────

export async function getCustomTasks(userId) {
  const { data, error } = await supabase
    .from('custom_tasks')
    .select('*')
    .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
  if (error) throw error
  return data || []
}

export async function createCustomTask(createdBy, assignedTo, task) {
  const { data, error } = await supabase
    .from('custom_tasks')
    .insert({
      created_by: createdBy,
      assigned_to: assignedTo,
      title: task.title,
      description: task.hint,
      emoji: task.emoji,
      freq: task.freq,
      xp: task.xp,
      coins: task.coins,
      hint: task.hint,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCustomTask(taskId) {
  const { error } = await supabase
    .from('custom_tasks')
    .delete()
    .eq('id', taskId)
  if (error) throw error
}

// ── CHALLENGES ────────────────────────────────────────────

export async function getMyChallenge(userId) {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('assigned_to', userId)
    .eq('status', 'pending')
    .order('assigned_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function assignChallenge(assignedBy, assignedTo, challenge) {
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      template_id: challenge.id,
      title: challenge.title,
      description: challenge.desc,
      emoji: challenge.emoji,
      xp: challenge.xp,
      coins: challenge.coins,
      freq: challenge.freq,
      assigned_by: assignedBy,
      assigned_to: assignedTo,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeChallenge(challengeId) {
  const { data, error } = await supabase
    .from('challenges')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', challengeId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── PARENT-CHILD LINKING ──────────────────────────────────

export async function getChildren(parentId) {
  const { data, error } = await supabase
    .from('parent_child')
    .select('child_id, profiles!child_id(*)')
    .eq('parent_id', parentId)
  if (error) throw error
  return (data || []).map(r => r.profiles)
}

export async function linkParentChild(parentId, childId) {
  const { error } = await supabase
    .from('parent_child')
    .insert({ parent_id: parentId, child_id: childId })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

// ── TEACHER-STUDENT LINKING ───────────────────────────────

export async function getStudents(teacherId) {
  const { data, error } = await supabase
    .from('teacher_student')
    .select('student_id, profiles!student_id(*)')
    .eq('teacher_id', teacherId)
  if (error) throw error
  return (data || []).map(r => r.profiles)
}

export async function linkTeacherStudent(teacherId, studentId, course) {
  const { error } = await supabase
    .from('teacher_student')
    .insert({ teacher_id: teacherId, student_id: studentId, course })
  if (error && error.code !== '23505') throw error
}

// ── MONTHLY HISTORY ───────────────────────────────────────

export async function getMonthlyHistory(userId) {
  const { data, error } = await supabase
    .from('monthly_history')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .limit(12)
  if (error) throw error
  return data || []
}

export async function upsertMonthHistory(userId, month, year, updates) {
  const { error } = await supabase
    .from('monthly_history')
    .upsert({ user_id: userId, month, year, ...updates }, { onConflict: 'user_id,month,year' })
  if (error) throw error
}
