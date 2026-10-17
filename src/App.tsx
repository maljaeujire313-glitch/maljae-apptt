import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Users, BookOpen, FileText, Phone, DollarSign,
  LogOut, Plus, CheckCircle, Lock, User, Loader2, AlertCircle,
  Search, GraduationCap, ClipboardList, X, Camera, BookMarked,
  ImagePlus, Edit2, Save, Filter, ChevronDown, Clock, Download, Share2, Calendar,
  Send, MessageCircle, Sparkles, Check, X as XIcon, File,
  Plane, CalendarPlus, ShieldAlert, TrendingUp, History,
  Camera as CameraIcon, UserCog, Trash2, ArrowUp, ArrowDown,
  HelpCircle, Bell, UsersRound, FileDown, Upload, Table
} from 'lucide-react';
import { supabase, type Student, type CallLog, type Note, type Mark, type FeePayment, type Leave, type MonthlyLeave, type LeaveBalance, type LeaveNonGoer, type GalleryImage, type Staff, type ExamConfig } from '@/lib/supabase';
import { toCsv, downloadCsv, parseCsv, type CsvRow } from '@/lib/csv-utils';

type Role = 'landing' | 'admin' | 'student' | 'parent';
type Tab = 'students' | 'calls' | 'exams' | 'fees' | 'notes' | 'leaves' | 'gallery' | 'staff';

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', '1st PUC', '2nd PUC'];

const PUC_CLASSES = ['Class 11', 'Class 12', '1st PUC', '2nd PUC'];
const PUC_SUBJECTS = ['Accountancy', 'Economics', 'History', 'Business Studies', 'Kannada', 'English'];
const REGULAR_SUBJECTS = ['Science', 'Social', 'Math', 'Kannada', 'Hindi', 'English'];

export default function App() {
  const [role, setRole] = useState<Role>('landing');
  const [activeTab, setActiveTab] = useState<Tab>('students');

  const [students, setStudents] = useState<Student[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [monthlyLeaves, setMonthlyLeaves] = useState<MonthlyLeave[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loggedInStaff, setLoggedInStaff] = useState<Staff | null>(null);
  const [staffLoginUser, setStaffLoginUser] = useState('');
  const [staffLoginPass, setStaffLoginPass] = useState('');
  const [staffLoginError, setStaffLoginError] = useState('');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [addStaffError, setAddStaffError] = useState<string | null>(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'staff'>('staff');
  const [staffSearch, setStaffSearch] = useState('');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffDraft, setEditStaffDraft] = useState<{ name: string; username: string; password: string; role: 'admin' | 'staff' }>({ name: '', username: '', password: '', role: 'staff' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('Class 6');
  const [newCategory, setNewCategory] = useState<'School' | 'Dars'>('School');
  const [newCustomId, setNewCustomId] = useState('');
  const [newFatherWhatsapp, setNewFatherWhatsapp] = useState('');
  const [newMotherWhatsapp, setNewMotherWhatsapp] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  const [noteClass, setNoteClass] = useState('Class 8');
  const [noteSubject, setNoteSubject] = useState('Maths');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteLink, setNoteLink] = useState('');
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [noteFilePreview, setNoteFilePreview] = useState<string | null>(null);
  const [noteUploading, setNoteUploading] = useState(false);

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Student full edit state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentDraft, setEditStudentDraft] = useState<{ name: string; class: string; category: 'School' | 'Dars'; custom_id: string; father_whatsapp: string; mother_whatsapp: string; username: string; password: string; parent_user: string; parent_pass: string }>({ name: '', class: 'Class 6', category: 'School', custom_id: '', father_whatsapp: '', mother_whatsapp: '', username: '', password: '', parent_user: '', parent_pass: '' });
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<string | null>(null);

  // Leave non-goers state
  const [nonGoers, setNonGoers] = useState<LeaveNonGoer[]>([]);
  const [examConfigs, setExamConfigs] = useState<ExamConfig[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, callsRes, notesRes, marksRes, feeRes, leavesRes, monthlyLeavesRes, balancesRes, galleryRes, staffRes, nonGoersRes, examConfigsRes] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('calls').select('*').order('called_at', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
        supabase.from('marks').select('*'),
        supabase.from('fee_payments').select('*'),
        supabase.from('leaves').select('*').order('created_at', { ascending: false }),
        supabase.from('monthly_leaves').select('*').order('created_at', { ascending: false }),
        supabase.from('leave_balances').select('*'),
        supabase.from('gallery_images').select('*').order('sort_order', { ascending: true }),
        supabase.from('staff').select('*').order('created_at', { ascending: false }),
        supabase.from('leave_non_goers').select('*'),
        supabase.from('exam_configs').select('*').order('created_at', { ascending: false }),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (callsRes.error) throw callsRes.error;
      if (notesRes.error) throw notesRes.error;
      if (marksRes.error) throw marksRes.error;
      if (feeRes.error) throw feeRes.error;
      if (leavesRes.error) throw leavesRes.error;
      if (monthlyLeavesRes.error) throw monthlyLeavesRes.error;
      if (balancesRes.error) throw balancesRes.error;
      if (galleryRes.error) throw galleryRes.error;
      if (staffRes.error) throw staffRes.error;
      if (nonGoersRes.error) throw nonGoersRes.error;
      if (examConfigsRes.error) throw examConfigsRes.error;

      setStudents(studentsRes.data as Student[]);
      setCalls(callsRes.data as CallLog[]);
      setNotes(notesRes.data as Note[]);
      setMarks(marksRes.data as Mark[]);
      setFeePayments(feeRes.data as FeePayment[]);
      setLeaves(leavesRes.data as Leave[]);
      setMonthlyLeaves(monthlyLeavesRes.data as MonthlyLeave[]);
      setLeaveBalances(balancesRes.data as LeaveBalance[]);
      setGalleryImages(galleryRes.data as GalleryImage[]);
      setStaff(staffRes.data as Staff[]);
      setNonGoers(nonGoersRes.data as LeaveNonGoer[]);
      setExamConfigs(examConfigsRes.data as ExamConfig[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const callsForStudent = (studentId: string) =>
    calls.filter((c) => c.student_id === studentId);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewPhoto(file);
    setNewPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (file: File, studentCustomId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${studentCustomId || Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('student-photos')
      .upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;
    return supabase.storage.from('student-photos').getPublicUrl(fileName).data.publicUrl;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!newFatherWhatsapp.trim()) {
      setAddStudentError("Father's WhatsApp number is required");
      return;
    }
    setAddStudentError(null);

    const randomNum = Math.floor(100 + Math.random() * 900);
    const base = newName.toLowerCase().replace(/\s+/g, '').slice(0, 4);
    const generatedUsername = `stu_${base}${randomNum}`;
    const generatedPassword = `pwd${randomNum}`;
    const generatedParentUser = `par_${base}${randomNum}`;
    const generatedParentPass = `ppwd${randomNum}`;

    let photoUrl: string | null = null;
    if (newPhoto) {
      try {
        photoUrl = await uploadPhoto(newPhoto, newCustomId || generatedUsername);
      } catch {
        setAddStudentError('Failed to upload photo, saving student without photo');
      }
    }

    try {
      const { data, error: insertError } = await supabase
        .from('students')
        .insert({
          name: newName,
          category: newCategory,
          class: newClass,
          username: generatedUsername,
          password: generatedPassword,
          parent_user: generatedParentUser,
          parent_pass: generatedParentPass,
          fees_paid: false,
          custom_id: newCustomId || null,
          photo_url: photoUrl,
          father_whatsapp: newFatherWhatsapp,
          mother_whatsapp: newMotherWhatsapp || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setStudents([data as Student, ...students]);
      setNewName('');
      setNewCustomId('');
      setNewFatherWhatsapp('');
      setNewMotherWhatsapp('');
      setNewPhoto(null);
      setNewPhotoPreview(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add student';
      setAddStudentError(msg);
    }
  };

  const filteredStudents = classFilter === 'all'
    ? students
    : students.filter((s) => s.class === classFilter);

  const handleLogCall = async (studentId: string, date: Date) => {
    try {
      const calledAt = new Date(date);
      calledAt.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
      const { data, error: insertError } = await supabase
        .from('calls')
        .insert({ student_id: studentId, called_at: calledAt.toISOString() })
        .select()
        .single();

      if (insertError) throw insertError;
      setCalls([data as CallLog, ...calls]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log call';
      setError(msg);
    }
  };

  const handleDeleteCall = async (callId: string) => {
    try {
      const { error } = await supabase.from('calls').delete().eq('id', callId);
      if (error) throw error;
      setCalls(calls.filter((c) => c.id !== callId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete call';
      setError(msg);
    }
  };

  const handleResetCalls = async (studentId: string) => {
    try {
      const { error } = await supabase.from('calls').delete().eq('student_id', studentId);
      if (error) throw error;
      setCalls(calls.filter((c) => c.student_id !== studentId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset call history';
      setError(msg);
    }
  };

  const handleUndoLastCall = async (studentId: string) => {
    try {
      const studentCalls = calls
        .filter((c) => c.student_id === studentId)
        .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime());
      if (studentCalls.length === 0) return;
      const lastCall = studentCalls[0];
      const { error } = await supabase.from('calls').delete().eq('id', lastCall.id);
      if (error) throw error;
      setCalls(calls.filter((c) => c.id !== lastCall.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to undo last call';
      setError(msg);
    }
  };

  const startEditStudent = (s: Student) => {
    setEditingStudentId(s.id);
    setEditStudentDraft({
      name: s.name, class: s.class, category: s.category, custom_id: s.custom_id || '',
      father_whatsapp: s.father_whatsapp || '', mother_whatsapp: s.mother_whatsapp || '',
      username: s.username, password: s.password, parent_user: s.parent_user, parent_pass: s.parent_pass,
    });
  };

  const handleUpdateStudent = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update({
          name: editStudentDraft.name,
          class: editStudentDraft.class,
          category: editStudentDraft.category,
          custom_id: editStudentDraft.custom_id || null,
          father_whatsapp: editStudentDraft.father_whatsapp || null,
          mother_whatsapp: editStudentDraft.mother_whatsapp || null,
          username: editStudentDraft.username,
          password: editStudentDraft.password,
          parent_user: editStudentDraft.parent_user,
          parent_pass: editStudentDraft.parent_pass,
        })
        .eq('id', studentId)
        .select()
        .single();
      if (error) throw error;
      setStudents(students.map((s) => (s.id === studentId ? data as Student : s)));
      setEditingStudentId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update student';
      setError(msg);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
      setStudents(students.filter((s) => s.id !== studentId));
      setConfirmDeleteStudent(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete student';
      setError(msg);
    }
  };

  const handleAddNonGoer = async (monthlyLeaveId: string, studentId: string, notes?: string) => {
    try {
      const { data, error } = await supabase
        .from('leave_non_goers')
        .insert({ monthly_leave_id: monthlyLeaveId, student_id: studentId, notes: notes || null })
        .select()
        .single();
      if (error) throw error;
      setNonGoers([...nonGoers, data as LeaveNonGoer]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add non-goer';
      setError(msg);
    }
  };

  const handleRemoveNonGoer = async (id: string) => {
    try {
      const { error } = await supabase.from('leave_non_goers').delete().eq('id', id);
      if (error) throw error;
      setNonGoers(nonGoers.filter((n) => n.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove non-goer';
      setError(msg);
    }
  };

  // --- Import / Export ---

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const exportStudents = () => {
    const headers = ['Name', 'Class', 'Category', 'Custom ID', 'Father WhatsApp', 'Mother WhatsApp', 'Username', 'Password', 'Parent Username', 'Parent Password'];
    const rows: CsvRow[] = students.map((s) => ({
      'Name': s.name,
      'Class': s.class,
      'Category': s.category,
      'Custom ID': s.custom_id || '',
      'Father WhatsApp': s.father_whatsapp || '',
      'Mother WhatsApp': s.mother_whatsapp || '',
      'Username': s.username,
      'Password': s.password,
      'Parent Username': s.parent_user,
      'Parent Password': s.parent_pass,
    }));
    downloadCsv(`students-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, headers));
  };

  const importStudents = async (file: File) => {
    setImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setImportStatus('No data rows found in the file.');
        return;
      }
      const toInsert = rows.map((r) => {
        const name = (r['Name'] || r['name'] || '').trim();
        const cls = (r['Class'] || r['class'] || 'Class 6').trim();
        const category = ((r['Category'] || r['category'] || 'School').trim() === 'Dars') ? 'Dars' : 'School';
        const customId = (r['Custom ID'] || r['custom_id'] || '').trim() || null;
        const fatherWa = (r['Father WhatsApp'] || r['father_whatsapp'] || '').trim() || null;
        const motherWa = (r['Mother WhatsApp'] || r['mother_whatsapp'] || '').trim() || null;
        const base = name.toLowerCase().replace(/\s+/g, '').slice(0, 4);
        const rnd = Math.floor(100 + Math.random() * 900);
        const username = (r['Username'] || r['username'] || '').trim() || `stu_${base}${rnd}`;
        const password = (r['Password'] || r['password'] || '').trim() || `pwd${rnd}`;
        const parentUser = (r['Parent Username'] || r['parent_user'] || '').trim() || `par_${base}${rnd}`;
        const parentPass = (r['Parent Password'] || r['parent_pass'] || '').trim() || `ppwd${rnd}`;
        return { name, class: cls, category, custom_id: customId, father_whatsapp: fatherWa, mother_whatsapp: motherWa, username, password, parent_user: parentUser, parent_pass: parentPass, fees_paid: false };
      }).filter((r) => r.name);

      if (toInsert.length === 0) {
        setImportStatus('No valid student rows (Name is required).');
        return;
      }

      const { data, error: insertError } = await supabase.from('students').insert(toInsert).select();
      if (insertError) throw insertError;
      const newStudents = (data as Student[]) || [];
      setStudents([...newStudents, ...students]);
      setImportStatus(`Successfully imported ${newStudents.length} student(s).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setImportStatus(`Import failed: ${msg}`);
    } finally {
      setImporting(false);
    }
  };

  const exportFees = () => {
    const headers = ['Student Name', 'Class', 'Year', 'Month', 'Amount', 'Paid', 'Paid At', 'Receipt ID'];
    const rows: CsvRow[] = feePayments.map((f) => {
      const stu = students.find((s) => s.id === f.student_id);
      return {
        'Student Name': stu?.name || 'Unknown',
        'Class': stu?.class || '',
        'Year': String(f.year),
        'Month': MONTH_NAMES[f.month - 1],
        'Amount': String(f.amount),
        'Paid': f.paid ? 'Yes' : 'No',
        'Paid At': f.paid_at ? new Date(f.paid_at).toLocaleDateString('en-IN') : '',
        'Receipt ID': f.receipt_id || '',
      };
    });
    downloadCsv(`fee-payments-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, headers));
  };

  const exportMarks = () => {
    const headers = ['Student Name', 'Class', 'Subject', 'Score', 'Exam Type', 'Exam Name'];
    const rows: CsvRow[] = marks.map((m) => {
      const stu = students.find((s) => s.id === m.student_id);
      return {
        'Student Name': stu?.name || 'Unknown',
        'Class': stu?.class || '',
        'Subject': m.subject,
        'Score': String(m.score),
        'Exam Type': m.exam_type || '',
        'Exam Name': m.exam_name || '',
      };
    });
    downloadCsv(`exam-marks-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, headers));
  };

  const importMarks = async (file: File) => {
    setImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setImportStatus('No data rows found in the file.');
        return;
      }
      const toInsert = rows.map((r) => {
        const studentName = (r['Student Name'] || r['student_name'] || '').trim();
        const stu = students.find((s) => s.name.toLowerCase() === studentName.toLowerCase());
        if (!stu) return null;
        const subject = (r['Subject'] || r['subject'] || '').trim();
        const score = Number(r['Score'] || r['score'] || 0);
        const rawExamType = (r['Exam Type'] || r['exam_type'] || '').trim();
        const examType: 'School' | 'Dars' | null = rawExamType === 'School' || rawExamType === 'Dars' ? rawExamType : null;
        const examName = (r['Exam Name'] || r['exam_name'] || '').trim() || null;
        return { student_id: stu.id, subject, score, exam_type: examType, exam_name: examName };
      }).filter((r): r is { student_id: string; subject: string; score: number; exam_type: 'School' | 'Dars' | null; exam_name: string | null } => r !== null && r.subject !== '');

      if (toInsert.length === 0) {
        setImportStatus('No valid mark rows. Ensure student names match existing records.');
        return;
      }

      const { data, error: insertError } = await supabase.from('marks').insert(toInsert).select();
      if (insertError) throw insertError;
      const newMarks = (data as Mark[]) || [];
      setMarks([...newMarks, ...marks]);
      setImportStatus(`Successfully imported ${newMarks.length} mark(s).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setImportStatus(`Import failed: ${msg}`);
    } finally {
      setImporting(false);
    }
  };

  const generateReceiptId = () => {
    const d = new Date();
    return `RCP-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  };

  const handleToggleFeePayment = async (studentId: string, year: number, month: number) => {
    const existing = feePayments.find((f) => f.student_id === studentId && f.year === year && f.month === month);

    if (existing) {
      const newPaid = !existing.paid;
      const updateData: Partial<FeePayment> = { paid: newPaid };
      if (newPaid) {
        updateData.paid_at = new Date().toISOString();
        if (!existing.receipt_id) updateData.receipt_id = generateReceiptId();
      } else {
        updateData.paid_at = null;
      }
      const { data, error } = await supabase
        .from('fee_payments')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      setFeePayments(feePayments.map((f) => (f.id === existing.id ? data as FeePayment : f)));
    } else {
      const receiptId = generateReceiptId();
      const { data, error } = await supabase
        .from('fee_payments')
        .insert({ student_id: studentId, year, month, amount: STANDARD_FEE, paid: true, paid_at: new Date().toISOString(), receipt_id: receiptId })
        .select()
        .single();
      if (error) throw error;
      setFeePayments([data as FeePayment, ...feePayments]);
    }
  };

  const handleNoteFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNoteFile(file);
    setNoteFilePreview(file.name);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    setNoteUploading(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileType: string | null = null;

      if (noteFile) {
        const safeName = `${Date.now()}-${noteFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: uploadErr } = await supabase.storage
          .from('notes-files')
          .upload(safeName, noteFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        fileUrl = supabase.storage.from('notes-files').getPublicUrl(safeName).data.publicUrl;
        fileName = noteFile.name;
        fileType = noteFile.type;
      }

      const { data, error: insertError } = await supabase
        .from('notes')
        .insert({
          class: noteClass,
          subject: noteSubject,
          title: noteTitle,
          link: noteLink,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          approved: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setNotes([data as Note, ...notes]);
      setNoteTitle('');
      setNoteLink('');
      setNoteFile(null);
      setNoteFilePreview(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add note';
      setError(msg);
    } finally {
      setNoteUploading(false);
    }
  };

  const handleToggleNoteApproval = async (noteId: string, currentApproved: boolean) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ approved: !currentApproved })
        .eq('id', noteId)
        .select()
        .single();
      if (error) throw error;
      setNotes(notes.map((n) => (n.id === noteId ? data as Note : n)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update note';
      setError(msg);
    }
  };

  const calcLeaveDays = (depDate: string, retDate: string) => {
    const d1 = new Date(depDate);
    const d2 = new Date(retDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  };

  const handleAddLeave = async (leave: {
    student_id: string;
    leave_type: 'School' | 'Dars';
    reason: string;
    departure_date: string;
    departure_time: string;
    return_date: string;
    return_time: string;
    status: 'approved' | 'pending';
    requested_by: string;
  }) => {
    try {
      const total_days = calcLeaveDays(leave.departure_date, leave.return_date);
      const { data, error } = await supabase
        .from('leaves')
        .insert({ ...leave, total_days })
        .select()
        .single();
      if (error) throw error;
      setLeaves([data as Leave, ...leaves]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add leave';
      setError(msg);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: 'approved' | 'pending' | 'rejected') => {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .update({ status })
        .eq('id', leaveId)
        .select()
        .single();
      if (error) throw error;
      setLeaves(leaves.map((l) => (l.id === leaveId ? data as Leave : l)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update leave';
      setError(msg);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    try {
      const { error } = await supabase.from('leaves').delete().eq('id', leaveId);
      if (error) throw error;
      setLeaves(leaves.filter((l) => l.id !== leaveId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete leave';
      setError(msg);
    }
  };

  const handleAddMonthlyLeave = async (ml: {
    year: number;
    month: number;
    leave_type: 'School' | 'Dars';
    title: string;
    start_date: string;
    end_date: string;
  }) => {
    try {
      const d1 = new Date(ml.start_date);
      const d2 = new Date(ml.end_date);
      const total_days = Math.max(Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1);
      const { data, error } = await supabase
        .from('monthly_leaves')
        .insert({ ...ml, total_days })
        .select()
        .single();
      if (error) throw error;
      setMonthlyLeaves([data as MonthlyLeave, ...monthlyLeaves]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add monthly leave';
      setError(msg);
    }
  };

  const handleDeleteMonthlyLeave = async (id: string) => {
    try {
      const { error } = await supabase.from('monthly_leaves').delete().eq('id', id);
      if (error) throw error;
      setMonthlyLeaves(monthlyLeaves.filter((m) => m.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete monthly leave';
      setError(msg);
    }
  };

  const handleUpdateLeaveBalance = async (balanceId: string, updates: Partial<LeaveBalance>) => {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .update(updates)
        .eq('id', balanceId)
        .select()
        .single();
      if (error) throw error;
      setLeaveBalances(leaveBalances.map((b) => (b.id === balanceId ? data as LeaveBalance : b)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update balance';
      setError(msg);
    }
  };

  const handleGalleryUpload = async (file: File) => {
    setGalleryUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `gallery-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const url = supabase.storage.from('gallery-photos').getPublicUrl(fileName).data.publicUrl;
      const { data, error: insertError } = await supabase
        .from('gallery_images')
        .insert({ url, alt: file.name.replace(/\.[^.]+$/, ''), sort_order: galleryImages.length })
        .select()
        .single();
      if (insertError) throw insertError;
      setGalleryImages([...galleryImages, data as GalleryImage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image';
      setError(msg);
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleDeleteGalleryImage = async (id: string, url: string) => {
    try {
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('gallery-photos').remove([fileName]);
      }
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      if (error) throw error;
      setGalleryImages(galleryImages.filter((g) => g.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete image';
      setError(msg);
    }
  };

  const handleReorderGallery = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...galleryImages].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((g) => g.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const item = sorted[idx];
    const swapItem = sorted[swapIdx];
    await Promise.all([
      supabase.from('gallery_images').update({ sort_order: swapItem.sort_order }).eq('id', item.id),
      supabase.from('gallery_images').update({ sort_order: item.sort_order }).eq('id', swapItem.id),
    ]);
    setGalleryImages(sorted.map((g) => {
      if (g.id === item.id) return { ...g, sort_order: swapItem.sort_order };
      if (g.id === swapItem.id) return { ...g, sort_order: item.sort_order };
      return g;
    }).sort((a, b) => a.sort_order - b.sort_order));
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffUsername.trim() || !newStaffPassword.trim()) return;
    setAddStaffError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('staff')
        .insert({ name: newStaffName, username: newStaffUsername, password: newStaffPassword, role: newStaffRole })
        .select()
        .single();
      if (insertError) throw insertError;
      setStaff([data as Staff, ...staff]);
      setNewStaffName('');
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffRole('staff');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add staff';
      setAddStaffError(msg);
    }
  };

  const handleUpdateStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ name: editStaffDraft.name, username: editStaffDraft.username, password: editStaffDraft.password, role: editStaffDraft.role })
        .eq('id', staffId);
      if (error) throw error;
      setStaff(staff.map((s) => s.id === staffId ? { ...s, ...editStaffDraft } : s));
      setEditingStaffId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update staff';
      setError(msg);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      const { error } = await supabase.from('staff').delete().eq('id', staffId);
      if (error) throw error;
      setStaff(staff.filter((s) => s.id !== staffId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete staff';
      setError(msg);
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffLoginError('');
    const member = staff.find((s) => s.username === staffLoginUser && s.password === staffLoginPass);
    if (member) {
      setLoggedInStaff(member);
    } else {
      setStaffLoginError('Invalid username or password');
    }
  };

  const handleStaffLogout = () => {
    setLoggedInStaff(null);
    setStaffLoginUser('');
    setStaffLoginPass('');
    setStaffLoginError('');
    setRole('landing');
  };

  const handleAddMarks = async (marksToInsert: { student_id: string; subject: string; score: number; exam_type: 'School' | 'Dars'; exam_name: string; total_marks: number }[]) => {
    try {
      const valid = marksToInsert.filter((m) => m.subject && m.score >= 0);
      if (valid.length === 0) return;
      const { data, error: insertError } = await supabase
        .from('marks')
        .insert(valid)
        .select();

      if (insertError) throw insertError;
      const newMarks = (data as Mark[]) || [];
      setMarks([...newMarks, ...marks]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add marks';
      setError(msg);
    }
  };

  const handleAddExamConfig = async (name: string, totalMarks: number, remarks?: string) => {
    try {
      const { data, error } = await supabase
        .from('exam_configs')
        .insert({ name, total_marks: totalMarks, remarks: remarks || null })
        .select()
        .single();
      if (error) throw error;
      setExamConfigs([data as ExamConfig, ...examConfigs]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add exam config';
      setError(msg);
    }
  };

  const handleDeleteExamConfig = async (id: string) => {
    try {
      const { error } = await supabase.from('exam_configs').delete().eq('id', id);
      if (error) throw error;
      setExamConfigs(examConfigs.filter((e) => e.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete exam config';
      setError(msg);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const student = students.find(
      (s) =>
        (role === 'student' && s.username === loginUser && s.password === loginPass) ||
        (role === 'parent' && s.parent_user === loginUser && s.parent_pass === loginPass)
    );
    if (student) {
      setLoggedInStudent(student);
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setLoggedInStudent(null);
    setLoginUser('');
    setLoginPass('');
    setLoginError('');
    setRole('landing');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-lg mb-2">Connection Error</p>
        <p className="text-slate-400 mb-6 text-center max-w-md">{error}</p>
        <button onClick={() => fetchData()} className="bg-emerald-600 px-6 py-2 rounded-lg hover:bg-emerald-500 transition">
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <Loader2 size={40} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-400">Loading academy data...</p>
      </div>
    );
  }

  // --- LANDING PAGE ---
  if (role === 'landing') {
    const landingGallery = galleryImages.length > 0
      ? galleryImages.map((g) => ({ url: g.url, alt: g.alt }))
      : [
          { url: 'https://images.pexels.com/photos/8423119/pexels-photo-8423119.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Children learning in a modern classroom' },
          { url: 'https://images.pexels.com/photos/20627702/pexels-photo-20627702.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Students reading religious texts during study hours' },
          { url: 'https://images.pexels.com/photos/34162713/pexels-photo-34162713.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Students engaged in classroom studies' },
          { url: 'https://images.pexels.com/photos/448877/pexels-photo-448877.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Young students in traditional attire focusing on studies' },
          { url: 'https://images.pexels.com/photos/8199168/pexels-photo-8199168.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Students actively participating in a lecture' },
          { url: 'https://images.pexels.com/photos/12949251/pexels-photo-12949251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Muslim students celebrating graduation with diplomas' },
          { url: 'https://images.pexels.com/photos/35865693/pexels-photo-35865693.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Student focused on writing during class' },
          { url: 'https://images.pexels.com/photos/32279024/pexels-photo-32279024.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', alt: 'Two students studying at a desk with books' },
        ];

    return (
      <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
        {/* Ambient lighting effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-amber-600/8 rounded-full blur-[100px]" />
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10">
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/30">
                <GraduationCap size={34} className="text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center tracking-tight mb-4 bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
              Maljae Educational Institutions
            </h1>

            {/* Sub-institutions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-full backdrop-blur-sm">
                <BookOpen size={18} className="text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Maljae English Medium Public School</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 border border-slate-700/80 rounded-full backdrop-blur-sm">
                <BookMarked size={18} className="text-blue-400" />
                <span className="text-sm font-medium text-slate-200">Maljae Ders</span>
              </div>
            </div>

            <p className="text-slate-400 mb-12 text-center max-w-lg">Select your portal to continue</p>

            {/* Portal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
              <button
                onClick={() => setRole('student')}
                className="group p-7 bg-slate-800/60 border border-slate-700/80 rounded-2xl hover:bg-slate-800 hover:border-emerald-500/50 transition-all duration-300 flex flex-col items-center hover:scale-[1.03] hover:shadow-2xl backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-emerald-600/15 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600/25 group-hover:scale-110 transition-all duration-300">
                  <User size={30} className="text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold">Student Login</h2>
                <p className="text-sm text-slate-500 mt-1">Access notes & marks</p>
              </button>
              <button
                onClick={() => setRole('parent')}
                className="group p-7 bg-slate-800/60 border border-slate-700/80 rounded-2xl hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center hover:scale-[1.03] hover:shadow-2xl backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-blue-600/15 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600/25 group-hover:scale-110 transition-all duration-300">
                  <Users size={30} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold">Parent Login</h2>
                <p className="text-sm text-slate-500 mt-1">Track your child's progress</p>
              </button>
              <button
                onClick={() => setRole('admin')}
                className="group p-7 bg-slate-800/60 border border-slate-700/80 rounded-2xl hover:bg-slate-800 hover:border-amber-500/50 transition-all duration-300 flex flex-col items-center hover:scale-[1.03] hover:shadow-2xl backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-amber-600/15 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-600/25 group-hover:scale-110 transition-all duration-300">
                  <Lock size={30} className="text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold">Staff / Admin</h2>
                <p className="text-sm text-slate-500 mt-1">Manage students & data</p>
              </button>
            </div>

            {/* Scroll hint */}
            <div className="mt-16 flex flex-col items-center gap-2 text-slate-600">
              <span className="text-xs uppercase tracking-widest">Gallery</span>
              <div className="w-px h-12 bg-gradient-to-b from-slate-600 to-transparent" />
            </div>
          </section>

          {/* Photo Gallery Section */}
          <section className="px-6 pb-24">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8 justify-center">
                <Camera size={24} className="text-emerald-400" />
                <h2 className="text-2xl md:text-3xl font-bold text-center">Our Institutions in Focus</h2>
              </div>
              <p className="text-slate-400 text-center mb-10 max-w-xl mx-auto">
                A glimpse into student life, learning, and achievement across our campuses.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {landingGallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxImage(img.url)}
                    className={`relative overflow-hidden rounded-xl border border-slate-700/60 group cursor-pointer ${
                      idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Lightbox */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-800/80 border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 transition"
            >
              <X size={20} className="text-white" />
            </button>
            <img
              src={lightboxImage}
              alt="Gallery full view"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  // --- LOGIN SCREEN (Student / Parent) ---
  if ((role === 'student' || role === 'parent') && !loggedInStudent) {
    const isStudent = role === 'student';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <button onClick={() => setRole('landing')} className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-1 text-sm">
          <LogOut size={16} /> Back
        </button>
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto ${isStudent ? 'bg-emerald-600/20' : 'bg-blue-600/20'}`}>
            {isStudent ? <User size={32} className="text-emerald-400" /> : <Users size={32} className="text-blue-400" />}
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">{isStudent ? 'Student Login' : 'Parent Login'}</h2>
          <p className="text-slate-400 text-center text-sm mb-6">Enter your credentials to access the portal</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Username</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-900/60 border border-slate-600 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-900/60 border border-slate-600 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
                required
              />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle size={16} /> {loginError}
              </div>
            )}
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-emerald-600/20">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- STUDENT / PARENT DASHBOARD ---
  if ((role === 'student' || role === 'parent') && loggedInStudent) {
    const studentCalls = callsForStudent(loggedInStudent.id);
    const studentMarks = marks.filter((m) => m.student_id === loggedInStudent.id);
    const availableNotes = notes.filter((n) => n.class === loggedInStudent.class && n.approved);

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === 'student' ? 'bg-emerald-600/20' : 'bg-blue-600/20'}`}>
              {role === 'student' ? <User size={20} className="text-emerald-400" /> : <Users size={20} className="text-blue-400" />}
            </div>
            <div>
              <h1 className="text-lg font-bold">{role === 'student' ? 'Student Dashboard' : 'Parent Dashboard'}</h1>
              <p className="text-xs text-slate-400">{loggedInStudent.name} - {loggedInStudent.class}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5 text-sm">
            <LogOut size={18} /> Logout
          </button>
        </header>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Phone size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{studentCalls.length}</p>
                  <p className="text-xs text-slate-500">Calls Logged</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{studentMarks.length}</p>
                  <p className="text-xs text-slate-500">Exam Marks</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <StudentFeeSummary studentId={loggedInStudent.id} feePayments={feePayments} />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
              <BookOpen size={20} className="text-emerald-600" /> Study Notes & Materials
            </h3>
            {availableNotes.length === 0 ? (
              <p className="text-slate-400 text-sm">No notes available for your class right now.</p>
            ) : (
              <div className="space-y-3">
                {availableNotes.map((n) => (
                  <div key={n.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center hover:border-emerald-300 transition">
                    <div className="flex items-center gap-3">
                      {n.file_url ? (
                        <File size={20} className="text-emerald-600 flex-shrink-0" />
                      ) : null}
                      <div>
                        <span className="text-xs bg-slate-200 px-2 py-0.5 rounded font-semibold text-slate-600">{n.class} - {n.subject}</span>
                        <h4 className="font-semibold mt-1.5 text-slate-800">{n.title}</h4>
                        {n.file_name && <p className="text-xs text-slate-400 mt-0.5">{n.file_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {n.file_url && (
                        <a href={n.file_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                          Open File
                        </a>
                      )}
                      {n.link && !n.file_url && (
                        <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <NotesAssistant notes={availableNotes} />

          {/* Leave Status */}
          <StudentLeaveCard
            studentId={loggedInStudent.id}
            studentClass={loggedInStudent.class}
            leaves={leaves}
            monthlyLeaves={monthlyLeaves}
            leaveBalances={leaveBalances}
            onAddLeave={handleAddLeave}
            canRequest={role === 'parent'}
          />

          {/* Marks — grouped by exam, all subjects in one row */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
              <FileText size={20} className="text-amber-600" /> Exam Marks
            </h3>
            {studentMarks.length === 0 ? (
              <p className="text-slate-400 text-sm">No marks recorded yet.</p>
            ) : (() => {
              // Group marks by exam_name
              const examGroups: { examName: string; totalMarks: number; subjectMarks: Record<string, number>; total: number }[] = [];
              const seenExams = new Set<string>();
              for (const m of studentMarks) {
                const examKey = m.exam_name || 'Unknown';
                if (!seenExams.has(examKey)) {
                  seenExams.add(examKey);
                  const groupMarks = studentMarks.filter((mm) => (mm.exam_name || 'Unknown') === examKey);
                  const subjMarks: Record<string, number> = {};
                  let total = 0;
                  for (const gm of groupMarks) {
                    subjMarks[gm.subject] = gm.score;
                    total += gm.score;
                  }
                  examGroups.push({
                    examName: examKey,
                    totalMarks: groupMarks[0]?.total_marks || 0,
                    subjectMarks: subjMarks,
                    total,
                  });
                }
              }
              const allSubjCols = Array.from(new Set(examGroups.flatMap((g) => Object.keys(g.subjectMarks)))).sort();

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 font-semibold text-slate-700 text-sm">Exam Name</th>
                        {allSubjCols.map((subj) => (
                          <th key={subj} className="p-3 font-semibold text-slate-700 text-sm whitespace-nowrap">{subj}</th>
                        ))}
                        <th className="p-3 font-semibold text-slate-700 text-sm whitespace-nowrap">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examGroups.map((g, idx) => (
                        <tr key={`${g.examName}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-3 font-medium text-slate-800 text-sm">{g.examName}</td>
                          {allSubjCols.map((subj) => (
                            <td key={subj} className="p-3 text-sm">
                              {g.subjectMarks[subj] !== undefined ? (
                                <span className="font-medium text-slate-800">{g.subjectMarks[subj]}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          ))}
                          <td className="p-3 text-sm">
                            <span className="font-bold text-emerald-700">{g.total}</span>
                            {g.totalMarks > 0 && (
                              <span className="text-slate-400">/{g.totalMarks * allSubjCols.filter((s) => g.subjectMarks[s] !== undefined).length}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* Call Tracking — visible to both student and parent */}
          <CallTrackingCard
            studentId={loggedInStudent.id}
            studentName={loggedInStudent.name}
            calls={studentCalls}
            readOnly={role !== 'parent'}
          />
        </div>
      </div>
    );
  }

  // --- STAFF LOGIN SCREEN ---
  if (role === 'admin' && !loggedInStaff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <button onClick={() => setRole('landing')} className="absolute top-6 left-6 text-slate-400 hover:text-white transition flex items-center gap-1 text-sm">
          <LogOut size={16} /> Back
        </button>
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto bg-amber-600/20">
            <Lock size={32} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Staff / Admin Login</h2>
          <p className="text-slate-400 text-center text-sm mb-6">Enter your staff credentials to access the portal</p>
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Username</label>
              <input
                type="text"
                value={staffLoginUser}
                onChange={(e) => setStaffLoginUser(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-900/60 border border-slate-600 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Password</label>
              <input
                type="password"
                value={staffLoginPass}
                onChange={(e) => setStaffLoginPass(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-900/60 border border-slate-600 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>
            {staffLoginError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle size={16} /> {staffLoginError}
              </div>
            )}
            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-amber-600/20">
              Sign In
            </button>
          </form>
          {staff.length > 0 && (
            <p className="text-center text-xs text-slate-500 mt-4">{staff.length} staff member{staff.length !== 1 ? 's' : ''} registered</p>
          )}
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-300 text-center">
              Default admin credentials — Username: <span className="font-mono font-bold">admin</span> · Password: <span className="font-mono font-bold">admin123</span>
            </p>
            <p className="text-[10px] text-amber-400/60 text-center mt-1">Change these after your first login via Staff Management.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  if (role === 'admin' && loggedInStaff) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 bg-slate-900 text-white p-6 flex flex-col justify-between lg:min-h-screen lg:sticky lg:top-0">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <GraduationCap size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-emerald-400">Admin Portal</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">Signed in as <span className="text-amber-400 font-medium">{loggedInStaff.name}</span>{loggedInStaff.role === 'admin' ? ' (Admin)' : ''}</p>
            <nav className="space-y-1.5 flex flex-wrap lg:flex-col gap-2">
              <button onClick={() => setActiveTab('students')} className={`flex items-center gap-3 p-3 rounded-lg transition w-full ${activeTab === 'students' ? 'bg-slate-800 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-300'}`}>
                <Users size={20} /> Students
              </button>
              <button onClick={() => setActiveTab('calls')} className={`flex items-center gap-3 p-3 rounded-lg transition w-full ${activeTab === 'calls' ? 'bg-slate-800 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-300'}`}>
                <Phone size={20} /> Call Logs
              </button>
              <button onClick={() => setActiveTab('exams')} className={`flex items-center gap-3 p-3 rounded-lg transition w-full ${activeTab === 'exams' ? 'bg-slate-800 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-300'}`}>
                <FileText size={20} /> Exams
              </button>
              <button onClick={() => setActiveTab('fees')} className={`flex items-center gap-3 p-3 rounded-lg transition w-full ${activeTab === 'fees' ? 'bg-slate-800 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-300'}`}>
                <DollarSign size={20} /> Fees
              </button>
              <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-3 p-3 rounded-lg transition w-full ${activeTab === 'notes' ? 'bg-slate-800 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-300'}`}>
                <BookOpen size={20} /> Notes
              </button>
              <button onClick={() => setActiveTab('leaves')} className={`flex items-center gap-3 p-3 rounded-lg transition w-full ${activeTab === 'leaves' ? 'bg-slate-800 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-300'}`}>
                <Plane size={20} /> Leaves
              </button>
              <button onClick={() => setActiveTab('gallery')} className={`flex items-center gap-3 p-3 rounded-lg transition w-full ${activeTab === 'gallery' ? 'bg-slate-800 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-300'}`}>
                <CameraIcon size={20} /> Gallery
              </button>
              {loggedInStaff.role === 'admin' && (
                <button onClick={() => setActiveTab('staff')} className={`flex items-center gap-3 p-3 rounded-lg transition w-full ${activeTab === 'staff' ? 'bg-slate-800 text-emerald-400 font-medium' : 'hover:bg-slate-800 text-slate-300'}`}>
                  <UserCog size={20} /> Staff
                </button>
              )}
            </nav>
          </div>
          <button onClick={handleStaffLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 mt-4 pt-4 border-t border-slate-700 transition">
            <LogOut size={20} /> Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div>
              <h1 className="text-2xl font-bold mb-6 text-slate-800">Student Management</h1>

              {/* Add Student Form */}
              <form onSubmit={handleAddStudent} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Student</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Photo Upload */}
                  <div className="md:col-span-1 flex flex-col items-center justify-start">
                    <label className="block text-sm font-medium mb-2 text-slate-700">Student Photo</label>
                    <label className="cursor-pointer group">
                      <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 group-hover:border-emerald-500 transition flex items-center justify-center overflow-hidden bg-slate-50">
                        {newPhotoPreview ? (
                          <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400">
                            <ImagePlus size={28} />
                            <span className="text-xs">Upload</span>
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>
                  </div>

                  {/* Form Fields */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Student full name" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700">Custom ID Number</label>
                      <input type="text" value={newCustomId} onChange={(e) => setNewCustomId(e.target.value)} placeholder="e.g. MEP-2026-001" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700">Class <span className="text-red-500">*</span></label>
                      <select value={newClass} onChange={(e) => setNewClass(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                        {CLASSES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700">Category <span className="text-red-500">*</span></label>
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as 'School' | 'Dars')} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                        <option>School</option><option>Dars</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700">Father's WhatsApp <span className="text-red-500">*</span></label>
                      <input type="tel" value={newFatherWhatsapp} onChange={(e) => setNewFatherWhatsapp(e.target.value)} placeholder="e.g. +91 98765 43210" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700">Mother's WhatsApp <span className="text-slate-400 text-xs">(optional)</span></label>
                      <input type="tel" value={newMotherWhatsapp} onChange={(e) => setNewMotherWhatsapp(e.target.value)} placeholder="e.g. +91 98765 43210" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" />
                    </div>
                  </div>
                </div>

                {addStudentError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <AlertCircle size={16} /> {addStudentError}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <button type="submit" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-500 transition shadow-sm font-medium">
                    <Plus size={18} /> Add Student
                  </button>
                  <p className="text-xs text-slate-500">Login credentials are auto-generated. You can edit them later in the table.</p>
                </div>
              </form>

              {/* Class Filter Bar */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-600">
                  <Filter size={18} />
                  <span className="text-sm font-medium">Filter by class:</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setClassFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${classFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    All ({students.length})
                  </button>
                  {CLASSES.map((c) => {
                    const count = students.filter((s) => s.class === c).length;
                    return (
                      <button
                        key={c}
                        onClick={() => setClassFilter(c)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${classFilter === c ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {c} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Import / Export Bar */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-600">
                  <Table size={18} />
                  <span className="text-sm font-medium">Data:</span>
                </div>
                <button onClick={exportStudents} className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium">
                  <Download size={15} /> Export CSV
                </button>
                <label className="flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition font-medium cursor-pointer">
                  <Upload size={15} /> Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importStudents(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {importing && <span className="text-sm text-slate-500 flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Importing...</span>}
                {importStatus && activeTab === 'students' && (
                  <span className={`text-sm ${importStatus.startsWith('Import failed') || importStatus.startsWith('No') ? 'text-red-600' : 'text-emerald-600'}`}>{importStatus}</span>
                )}
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 font-semibold text-slate-700">Photo</th>
                        <th className="p-4 font-semibold text-slate-700">Name / ID</th>
                        <th className="p-4 font-semibold text-slate-700">Class / Category</th>
                        <th className="p-4 font-semibold text-slate-700">WhatsApp</th>
                        <th className="p-4 font-semibold text-slate-700">Student Login</th>
                        <th className="p-4 font-semibold text-slate-700">Parent Login</th>
                        <th className="p-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">No students found.</td></tr>
                      ) : filteredStudents.map((s) => {
                        const isEditing = editingStudentId === s.id;
                        return (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="p-4">
                              {s.photo_url ? (
                                <img src={s.photo_url} alt={s.name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                                  <User size={18} className="text-slate-400" />
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <input value={editStudentDraft.name} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, name: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs" placeholder="Name" />
                                  <input value={editStudentDraft.custom_id} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, custom_id: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs" placeholder="Custom ID" />
                                </div>
                              ) : (
                                <>
                                  <p className="font-semibold text-slate-800">{s.name}</p>
                                  {s.custom_id && <p className="text-xs text-slate-500 font-mono">{s.custom_id}</p>}
                                </>
                              )}
                            </td>
                            <td className="p-4 text-slate-600">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <select value={editStudentDraft.class} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, class: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs">
                                    {CLASSES.map((c) => <option key={c}>{c}</option>)}
                                  </select>
                                  <select value={editStudentDraft.category} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, category: e.target.value as 'School' | 'Dars' })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs">
                                    <option>School</option><option>Dars</option>
                                  </select>
                                </div>
                              ) : (
                                <>{s.class} <span className="text-xs bg-slate-100 px-2 py-0.5 rounded ml-1">{s.category}</span></>
                              )}
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <input value={editStudentDraft.father_whatsapp} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, father_whatsapp: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs" placeholder="Father's WhatsApp" />
                                  <input value={editStudentDraft.mother_whatsapp} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, mother_whatsapp: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs" placeholder="Mother's WhatsApp" />
                                </div>
                              ) : (
                                <>
                                  <p className="flex items-center gap-1"><Phone size={13} className="text-emerald-500" /> {s.father_whatsapp || '-'}</p>
                                  {s.mother_whatsapp && <p className="flex items-center gap-1 mt-0.5 text-slate-400"><Phone size={13} /> {s.mother_whatsapp}</p>}
                                </>
                              )}
                            </td>
                            <td className="p-4 text-sm font-mono text-slate-600">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <input value={editStudentDraft.username} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, username: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs" placeholder="Username" />
                                  <input value={editStudentDraft.password} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, password: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs" placeholder="Password" />
                                </div>
                              ) : (
                                <div>U: {s.username}<br />P: {s.password}</div>
                              )}
                            </td>
                            <td className="p-4 text-sm font-mono text-slate-600">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <input value={editStudentDraft.parent_user} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, parent_user: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs" placeholder="Parent username" />
                                  <input value={editStudentDraft.parent_pass} onChange={(e) => setEditStudentDraft({ ...editStudentDraft, parent_pass: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-xs" placeholder="Parent password" />
                                </div>
                              ) : (
                                <div>U: {s.parent_user}<br />P: {s.parent_pass}</div>
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleUpdateStudent(s.id)} className="bg-emerald-600 text-white p-1.5 rounded-lg hover:bg-emerald-500 transition" title="Save">
                                    <Save size={16} />
                                  </button>
                                  <button onClick={() => setEditingStudentId(null)} className="bg-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-300 transition" title="Cancel">
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : confirmDeleteStudent === s.id ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-red-600 font-medium">Delete?</span>
                                  <button onClick={() => handleDeleteStudent(s.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-500 transition">Yes</button>
                                  <button onClick={() => setConfirmDeleteStudent(null)} className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs hover:bg-slate-300 transition">No</button>
                                </div>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button onClick={() => startEditStudent(s)} className="bg-slate-100 text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition" title="Edit student">
                                    <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => setConfirmDeleteStudent(s.id)} className="bg-red-100 text-red-600 p-1.5 rounded-lg hover:bg-red-200 transition" title="Delete student">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CALL LOGS TAB */}
          {activeTab === 'calls' && (
            <CallLogsManager
              students={students}
              calls={calls}
              onLogCall={handleLogCall}
              onDeleteCall={handleDeleteCall}
              onResetCalls={handleResetCalls}
              onUndoLastCall={handleUndoLastCall}
            />
          )}

          {/* EXAMS TAB */}
          {activeTab === 'exams' && (
            <div>
              <ExamMarksManager
                students={students}
                marks={marks}
                examConfigs={examConfigs}
                onAddMarks={handleAddMarks}
                onAddExamConfig={handleAddExamConfig}
                onDeleteExamConfig={handleDeleteExamConfig}
              />
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-4 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-600">
                  <Table size={18} />
                  <span className="text-sm font-medium">Marks Data:</span>
                </div>
                <button onClick={exportMarks} className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium">
                  <Download size={15} /> Export CSV
                </button>
                <label className="flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition font-medium cursor-pointer">
                  <Upload size={15} /> Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importMarks(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {importing && <span className="text-sm text-slate-500 flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Importing...</span>}
                {importStatus && activeTab === 'exams' && (
                  <span className={`text-sm ${importStatus.startsWith('Import failed') || importStatus.startsWith('No') ? 'text-red-600' : 'text-emerald-600'}`}>{importStatus}</span>
                )}
                <p className="text-xs text-slate-400 w-full">Import requires student names to match existing records exactly.</p>
              </div>
            </div>
          )}

          {/* FEES TAB */}
          {activeTab === 'fees' && (
            <div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-600">
                  <Table size={18} />
                  <span className="text-sm font-medium">Fee Data:</span>
                </div>
                <button onClick={exportFees} className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium">
                  <Download size={15} /> Export CSV
                </button>
              </div>
              <FeeManager
                students={students}
                feePayments={feePayments}
                onTogglePayment={handleToggleFeePayment}
              />
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <NotesManager
              notes={notes}
              noteClass={noteClass}
              setNoteClass={setNoteClass}
              noteSubject={noteSubject}
              setNoteSubject={setNoteSubject}
              noteTitle={noteTitle}
              setNoteTitle={setNoteTitle}
              noteLink={noteLink}
              setNoteLink={setNoteLink}
              noteFilePreview={noteFilePreview}
              onFileSelect={handleNoteFileSelect}
              onAddNote={handleAddNote}
              onToggleApproval={handleToggleNoteApproval}
              uploading={noteUploading}
            />
          )}

          {/* LEAVES TAB */}
          {activeTab === 'leaves' && (
            <LeaveManager
              students={students}
              leaves={leaves}
              monthlyLeaves={monthlyLeaves}
              leaveBalances={leaveBalances}
              nonGoers={nonGoers}
              onAddLeave={handleAddLeave}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onDeleteLeave={handleDeleteLeave}
              onAddMonthlyLeave={handleAddMonthlyLeave}
              onDeleteMonthlyLeave={handleDeleteMonthlyLeave}
              onUpdateBalance={handleUpdateLeaveBalance}
              onAddNonGoer={handleAddNonGoer}
              onRemoveNonGoer={handleRemoveNonGoer}
            />
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <GalleryManager
              images={galleryImages}
              onUpload={handleGalleryUpload}
              onDelete={handleDeleteGalleryImage}
              onReorder={handleReorderGallery}
              uploading={galleryUploading}
            />
          )}

          {/* STAFF TAB (admin only) */}
          {activeTab === 'staff' && loggedInStaff.role === 'admin' && (
            <StaffManager
              staff={staff}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onDeleteStaff={handleDeleteStaff}
              addStaffError={addStaffError}
              newStaffName={newStaffName}
              setNewStaffName={setNewStaffName}
              newStaffUsername={newStaffUsername}
              setNewStaffUsername={setNewStaffUsername}
              newStaffPassword={newStaffPassword}
              setNewStaffPassword={setNewStaffPassword}
              newStaffRole={newStaffRole}
              setNewStaffRole={setNewStaffRole}
              editingStaffId={editingStaffId}
              setEditingStaffId={setEditingStaffId}
              editStaffDraft={editStaffDraft}
              setEditStaffDraft={setEditStaffDraft}
              staffSearch={staffSearch}
              setStaffSearch={setStaffSearch}
            />
          )}
        </main>
      </div>
    );
  }

  return null;
}

// --- EXAM MARKS MANAGER (Admin) ---
const EXAM_NAMES = ['FA1', 'FA2', 'FA3', 'SA1', 'SA2'];

function getSubjectsForClass(cls: string): string[] {
  return PUC_CLASSES.includes(cls) ? PUC_SUBJECTS : REGULAR_SUBJECTS;
}

function ExamMarksManager({
  students,
  marks,
  examConfigs,
  onAddMarks,
  onAddExamConfig,
  onDeleteExamConfig,
}: {
  students: Student[];
  marks: Mark[];
  examConfigs: ExamConfig[];
  onAddMarks: (marksToInsert: { student_id: string; subject: string; score: number; exam_type: 'School' | 'Dars'; exam_name: string; total_marks: number }[]) => void;
  onAddExamConfig: (name: string, totalMarks: number, remarks?: string) => void;
  onDeleteExamConfig: (id: string) => void;
}) {
  const [formClass, setFormClass] = useState<string>('');
  const [formStudent, setFormStudent] = useState<string>('');
  const [formExamName, setFormExamName] = useState<string>('');
  const [formTotalMarks, setFormTotalMarks] = useState<number>(100);
  const [subjectScores, setSubjectScores] = useState<Record<string, string>>({});
  const [showExamConfigModal, setShowExamConfigModal] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamTotal, setNewExamTotal] = useState<number>(100);
  const [newExamRemarks, setNewExamRemarks] = useState('');

  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterExamName, setFilterExamName] = useState<string>('all');

  const formStudents = formClass ? students.filter((s) => s.class === formClass) : [];
  const currentSubjects = formClass ? getSubjectsForClass(formClass) : [];

  const handleFormStudentChange = (val: string) => {
    setFormStudent(val);
  };

  const handleClassChange = (cls: string) => {
    setFormClass(cls);
    setFormStudent('');
    setSubjectScores({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudent || !formExamName.trim()) return;
    const stu = students.find((s) => s.id === formStudent);
    if (!stu) return;
    const examType = stu.category as 'School' | 'Dars';
    const toInsert = currentSubjects
      .filter((subj) => subjectScores[subj] !== '' && subjectScores[subj] !== undefined)
      .map((subj) => ({
        student_id: formStudent,
        subject: subj,
        score: Number(subjectScores[subj]),
        exam_type: examType,
        exam_name: formExamName.trim(),
        total_marks: formTotalMarks,
      }));
    if (toInsert.length === 0) return;
    onAddMarks(toInsert);
    setSubjectScores({});
  };

  const handleAddExamConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) return;
    onAddExamConfig(newExamName.trim(), newExamTotal, newExamRemarks.trim() || undefined);
    setNewExamName('');
    setNewExamTotal(100);
    setNewExamRemarks('');
    setShowExamConfigModal(false);
  };

  // Group marks by student + exam_name for row-per-student-per-exam display
  const allExamNamesInMarks = Array.from(new Set(marks.map((m) => m.exam_name).filter(Boolean))) as string[];
  const filterStudents = filterClass === 'all' ? students : students.filter((s) => s.class === filterClass);

  type GroupedRow = {
    studentId: string;
    studentName: string;
    studentClass: string;
    customId: string | null;
    examName: string;
    examType: string;
    totalMarks: number;
    subjectMarks: Record<string, number>;
    total: number;
  };

  const groupedRows: GroupedRow[] = [];
  const seen = new Set<string>();
  for (const m of marks) {
    const stu = students.find((s) => s.id === m.student_id);
    if (!stu) continue;
    if (filterClass !== 'all' && stu.class !== filterClass) continue;
    if (filterExamName !== 'all' && m.exam_name !== filterExamName) continue;
    const key = `${m.student_id}__${m.exam_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      const rowMarks = marks.filter((mm) => mm.student_id === m.student_id && mm.exam_name === m.exam_name);
      const subjMarks: Record<string, number> = {};
      let total = 0;
      for (const rm of rowMarks) {
        subjMarks[rm.subject] = rm.score;
        total += rm.score;
      }
      groupedRows.push({
        studentId: m.student_id,
        studentName: stu.name,
        studentClass: stu.class,
        customId: stu.custom_id,
        examName: m.exam_name || '-',
        examType: (m.exam_type || 'School') === 'School' ? 'School' : 'Ders',
        totalMarks: m.total_marks || rowMarks[0]?.total_marks || 0,
        subjectMarks: subjMarks,
        total,
      });
    }
  }

  // Collect all subjects across grouped rows for column headers
  const tableSubjects = Array.from(new Set(groupedRows.flatMap((r) => Object.keys(r.subjectMarks)))).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Exam Marks</h1>
        <button
          onClick={() => setShowExamConfigModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition font-medium text-sm"
        >
          <Plus size={16} /> Add Exam Configuration
        </button>
      </div>

      {/* Exam Configs List */}
      {examConfigs.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-600" /> Configured Exams
          </h3>
          <div className="flex flex-wrap gap-2">
            {examConfigs.map((ec) => (
              <div key={ec.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-slate-700">{ec.name}</span>
                <span className="text-xs text-slate-500">Out of {ec.total_marks}</span>
                {ec.remarks && <span className="text-xs text-slate-400 italic">— {ec.remarks}</span>}
                <button
                  onClick={() => onDeleteExamConfig(ec.id)}
                  className="text-red-400 hover:text-red-600 transition"
                  title="Delete exam config"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record New Mark Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-emerald-600" /> Record New Marks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Class <span className="text-red-500">*</span></label>
            <select value={formClass} onChange={(e) => handleClassChange(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required>
              <option value="">Select class...</option>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Student <span className="text-red-500">*</span></label>
            <select value={formStudent} onChange={(e) => handleFormStudentChange(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required disabled={!formClass}>
              <option value="">Select student...</option>
              {formStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Exam Name <span className="text-red-500">*</span></label>
            <select value={formExamName} onChange={(e) => setFormExamName(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required>
              <option value="">Select exam...</option>
              {EXAM_NAMES.map((n) => <option key={n}>{n}</option>)}
              {examConfigs.map((ec) => <option key={ec.id} value={ec.name}>{ec.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Out of Marks <span className="text-red-500">*</span></label>
            <select value={formTotalMarks} onChange={(e) => setFormTotalMarks(Number(e.target.value))} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
              {[15, 20, 50, 100].map((v) => <option key={v} value={v}>{v}</option>)}
              {examConfigs.find((ec) => ec.name === formExamName) && (
                <option value={examConfigs.find((ec) => ec.name === formExamName)!.total_marks}>
                  {examConfigs.find((ec) => ec.name === formExamName)!.total_marks} (from config)
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Dynamic Subject Score Inputs */}
        {formClass && currentSubjects.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-slate-700">Subject Marks (enter scores for each subject)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {currentSubjects.map((subj) => (
                <div key={subj}>
                  <label className="block text-xs font-medium mb-1 text-slate-600">{subj}</label>
                  <input
                    type="number"
                    value={subjectScores[subj] ?? ''}
                    onChange={(e) => setSubjectScores({ ...subjectScores, [subj]: e.target.value })}
                    placeholder="0"
                    min={0}
                    max={formTotalMarks}
                    className="border border-slate-300 p-2 rounded-lg w-full text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <button type="submit" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-500 transition font-medium">
            <Plus size={18} /> Save Marks
          </button>
        </div>
      </form>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filter recorded marks:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition">
            <option value="all">All Classes</option>
            {CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={filterExamName} onChange={(e) => setFilterExamName(e.target.value)} className="border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition">
            <option value="all">All Exam Names</option>
            {allExamNamesInMarks.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        {(filterClass !== 'all' || filterExamName !== 'all') && (
          <button
            onClick={() => { setFilterClass('all'); setFilterExamName('all'); }}
            className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Recorded Marks Table — row per student per exam */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-emerald-600" /> Recorded Marks
          </h3>
          <span className="text-sm text-slate-500">{groupedRows.length} record{groupedRows.length !== 1 ? 's' : ''}</span>
        </div>
        {groupedRows.length === 0 ? (
          <p className="p-8 text-center text-slate-400 text-sm">No marks found. Adjust filters or add new marks above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-semibold text-slate-700 text-sm whitespace-nowrap">Student</th>
                  <th className="p-3 font-semibold text-slate-700 text-sm">ID</th>
                  <th className="p-3 font-semibold text-slate-700 text-sm">Class</th>
                  <th className="p-3 font-semibold text-slate-700 text-sm">Exam Name</th>
                  <th className="p-3 font-semibold text-slate-700 text-sm">Type</th>
                  {tableSubjects.map((subj) => (
                    <th key={subj} className="p-3 font-semibold text-slate-700 text-sm whitespace-nowrap">{subj}</th>
                  ))}
                  <th className="p-3 font-semibold text-slate-700 text-sm whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {groupedRows.map((row, idx) => (
                  <tr key={`${row.studentId}-${row.examName}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-3 font-medium text-slate-800 text-sm">{row.studentName}</td>
                    <td className="p-3 text-slate-500 text-sm font-mono">{row.customId || '-'}</td>
                    <td className="p-3 text-slate-600 text-sm">{row.studentClass}</td>
                    <td className="p-3 text-slate-600 text-sm">{row.examName}</td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.examType === 'School' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {row.examType}
                      </span>
                    </td>
                    {tableSubjects.map((subj) => (
                      <td key={subj} className="p-3 text-sm">
                        {row.subjectMarks[subj] !== undefined ? (
                          <span className="font-medium text-slate-800">{row.subjectMarks[subj]}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    ))}
                    <td className="p-3 text-sm">
                      <span className="font-bold text-emerald-700">{row.total}</span>
                      {row.totalMarks > 0 && <span className="text-slate-400">/{row.totalMarks * tableSubjects.filter((s) => row.subjectMarks[s] !== undefined).length || row.totalMarks}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam Config Modal */}
      {showExamConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowExamConfigModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Add Exam Configuration</h3>
              <button onClick={() => setShowExamConfigModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExamConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Exam Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="e.g. FA1, SA2, Quarterly"
                  className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Total / Out-of Marks <span className="text-red-500">*</span></label>
                <select value={newExamTotal} onChange={(e) => setNewExamTotal(Number(e.target.value))} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                  {[15, 20, 50, 100].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Remarks / Notes <span className="text-slate-400 text-xs">(optional)</span></label>
                <textarea
                  value={newExamRemarks}
                  onChange={(e) => setNewExamRemarks(e.target.value)}
                  placeholder="e.g. First formative assessment for the academic year"
                  rows={2}
                  className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-500 transition font-medium flex items-center justify-center gap-2">
                <Plus size={18} /> Add Exam
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CALL LOGS MANAGER (Admin) ---
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function getWeekDates(): Date[] {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function CallLogsManager({
  students,
  calls,
  onLogCall,
  onDeleteCall,
  onResetCalls,
  onUndoLastCall,
}: {
  students: Student[];
  calls: CallLog[];
  onLogCall: (studentId: string, date: Date) => void;
  onDeleteCall: (callId: string) => void;
  onResetCalls: (studentId: string) => void;
  onUndoLastCall: (studentId: string) => void;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const weekDates = getWeekDates();
  const today = new Date();

  const callsForStudent = (studentId: string) =>
    calls.filter((c) => c.student_id === studentId);

  const callsOnDate = (studentId: string, date: Date) =>
    callsForStudent(studentId).filter((c) => isSameDay(new Date(c.called_at), date));

  const weekRangeStr = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Call Logs & Tracking</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-lg">
          <Clock size={16} />
          Week of {weekRangeStr}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-400">
          No students to track.
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const sCalls = callsForStudent(s.id);
            const weekCallCount = weekDates.reduce((sum, d) => sum + callsOnDate(s.id, d).length, 0);
            const isExpanded = expandedRow === s.id;

            return (
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Student header row */}
                <div className="flex items-center justify-between p-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                        <User size={18} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.class} · {s.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                      {weekCallCount} this week
                    </span>
                    <span className="text-sm text-slate-500 hidden sm:inline">
                      Total: {sCalls.length}
                    </span>
                    {sCalls.length > 0 && (
                      <button
                        onClick={() => onUndoLastCall(s.id)}
                        className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium bg-amber-50 px-2.5 py-1.5 rounded-lg transition border border-amber-200"
                        title="Remove the most recent call for this student"
                      >
                        <ArrowDown size={14} className="rotate-180" /> Undo Last
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedRow(isExpanded ? null : s.id)}
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium bg-slate-100 px-3 py-1.5 rounded-lg transition"
                    >
                      {isExpanded ? 'Hide' : 'History'}
                      <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* 7-day buttons */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((date, idx) => {
                      const dayCalls = callsOnDate(s.id, date);
                      const hasCalls = dayCalls.length > 0;
                      const isToday = isSameDay(date, today);
                      const isFuture = date > today;

                      return (
                        <button
                          key={idx}
                          onClick={() => onLogCall(s.id, date)}
                          disabled={isFuture && !hasCalls}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs transition ${
                            hasCalls
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                              : isFuture
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                          } ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                        >
                          <span className="font-semibold">{WEEKDAYS_SHORT[idx]}</span>
                          <span className={`text-lg font-bold ${hasCalls ? 'text-white' : 'text-slate-400'}`}>
                            {date.getDate()}
                          </span>
                          {hasCalls && (
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <CheckCircle size={10} /> {dayCalls.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expandable history */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock size={15} /> Full Call History ({sCalls.length} total)
                      </h4>
                      {sCalls.length > 0 && (
                        <div className="flex items-center gap-2">
                          {confirmReset === s.id ? (
                            <>
                              <span className="text-xs text-red-600 font-medium">Delete all calls?</span>
                              <button
                                onClick={() => { onResetCalls(s.id); setConfirmReset(null); }}
                                className="text-xs bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-500 transition font-medium"
                              >
                                Yes, reset all
                              </button>
                              <button
                                onClick={() => setConfirmReset(null)}
                                className="text-xs bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-300 transition font-medium"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmReset(s.id)}
                              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium bg-red-50 px-2.5 py-1.5 rounded-lg transition border border-red-200"
                              title="Delete all call history for this student"
                            >
                              <Trash2 size={13} /> Reset All Calls
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {sCalls.length === 0 ? (
                      <p className="text-slate-400 text-sm">No calls logged yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {sCalls
                          .slice()
                          .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())
                          .map((c) => {
                            const d = new Date(c.called_at);
                            const dayName = WEEKDAYS_FULL[d.getDay()];
                            return (
                              <div key={c.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg group">
                                <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                                <div className="flex-1 flex items-center justify-between flex-wrap gap-1">
                                  <span className="text-sm font-medium text-slate-700">{dayName}</span>
                                  <span className="text-sm text-slate-500">
                                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                                    {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <button
                                  onClick={() => onDeleteCall(c.id)}
                                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition flex-shrink-0"
                                  title="Delete this call entry"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- CALL TRACKING CARD (Student / Parent dashboard) ---
function CallTrackingCard({
  calls,
}: {
  studentId: string;
  studentName: string;
  calls: CallLog[];
  readOnly: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const weekDates = getWeekDates();
  const today = new Date();

  const callsOnDate = (date: Date) =>
    calls.filter((c) => isSameDay(new Date(c.called_at), date));

  const weekCallCount = weekDates.reduce((sum, d) => sum + callsOnDate(d).length, 0);
  const weekRangeStr = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
          <Phone size={20} className="text-blue-600" /> Call Tracking
        </h3>
        <span className="text-sm text-slate-500 flex items-center gap-1.5">
          <Clock size={14} /> {weekRangeStr}
        </span>
      </div>

      {/* Weekly summary */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-2xl font-bold text-blue-700">{weekCallCount}</span>
          <span className="text-sm text-blue-600 ml-1.5">calls this week</span>
        </div>
        <div className="text-sm text-slate-500">
          Total all-time: <span className="font-semibold text-slate-700">{calls.length}</span>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDates.map((date, idx) => {
          const dayCalls = callsOnDate(date);
          const hasCalls = dayCalls.length > 0;
          const isToday = isSameDay(date, today);

          return (
            <div
              key={idx}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs ${
                hasCalls
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              } ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
            >
              <span className="font-semibold text-slate-600">{WEEKDAYS_SHORT[idx]}</span>
              <span className={`text-lg font-bold ${hasCalls ? 'text-emerald-600' : 'text-slate-400'}`}>
                {date.getDate()}
              </span>
              {hasCalls ? (
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                  <CheckCircle size={10} /> {dayCalls.length}
                </span>
              ) : (
                <span className="text-[10px] text-slate-300">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Toggle history */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium transition"
      >
        {showHistory ? 'Hide' : 'Show'} full call history
        <ChevronDown size={16} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
      </button>

      {showHistory && (
        <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
          {calls.length === 0 ? (
            <p className="text-slate-400 text-sm">No calls logged yet.</p>
          ) : (
            calls
              .slice()
              .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())
              .map((c) => {
                const d = new Date(c.called_at);
                const dayName = WEEKDAYS_FULL[d.getDay()];
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 flex items-center justify-between flex-wrap gap-1">
                      <span className="text-sm font-medium text-slate-700">{dayName}</span>
                      <span className="text-sm text-slate-500">
                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                        {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}

// --- FEE CONSTANTS (module-level) ---
const STANDARD_FEE = 1500;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

// Academic cycle: June (6) through March (3) — 10 months
const ACADEMIC_MONTHS = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

function getAcademicYear(date: Date): number {
  // Academic year starts in June. If month < June (before June), it belongs to the previous academic year.
  return date.getMonth() + 1 < 6 ? date.getFullYear() - 1 : date.getFullYear();
}

function getCurrentAcademicMonth(): number | null {
  const now = new Date();
  const m = now.getMonth() + 1;
  if (ACADEMIC_MONTHS.includes(m)) return m;
  return null; // April and May are off-cycle
}

// --- FEE MANAGER (Admin) ---
function FeeManager({
  students,
  feePayments,
  onTogglePayment,
}: {
  students: Student[];
  feePayments: FeePayment[];
  onTogglePayment: (studentId: string, year: number, month: number) => void;
}) {
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string>('all');
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState<number>(getAcademicYear(new Date()));
  const currentMonth = new Date().getMonth() + 1;
  const currentAcademicYear = getAcademicYear(new Date());

  // Determine which months have elapsed in the viewing academic year
  const elapsedMonths = (() => {
    if (viewYear < currentAcademicYear) return ACADEMIC_MONTHS; // past year, all months
    if (viewYear > currentAcademicYear) return []; // future year, none
    // Current academic year: months up to and including current month (if in cycle)
    return ACADEMIC_MONTHS.filter((m) => {
      const monthYear = m >= 6 ? viewYear : viewYear + 1;
      if (monthYear < currentYear) return true;
      if (monthYear > currentYear) return false;
      return m <= currentMonth;
    });
  })();

  const filteredStudents = filterClass === 'all' ? students : students.filter((s) => s.class === filterClass);

  const paymentsFor = (studentId: string, year: number, month: number) =>
    feePayments.find((f) => f.student_id === studentId && f.year === year && f.month === month);

  const pendingAmount = (studentId: string) => {
    let total = 0;
    for (const m of elapsedMonths) {
      const p = paymentsFor(studentId, viewYear, m);
      if (!p || !p.paid) total += STANDARD_FEE;
    }
    return total;
  };

  const totalPending = filteredStudents.reduce((sum, s) => sum + pendingAmount(s.id), 0);
  const totalCollected = feePayments
    .filter((f) => f.paid && f.year === viewYear && ACADEMIC_MONTHS.includes(f.month) && filteredStudents.some((s) => s.id === f.student_id))
    .reduce((sum, f) => sum + f.amount, 0);

  const generateReceipt = (student: Student, payment: FeePayment) => {
    const monthName = MONTH_NAMES[payment.month - 1];
    const receiptHtml = `
      <html>
      <head>
        <title>Fee Receipt - ${student.name} - ${monthName} ${payment.year}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; }
          .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #059669; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #065f46, #047857); color: white; padding: 24px 32px; text-align: center; }
          .header h1 { font-size: 22px; margin-bottom: 4px; }
          .header p { font-size: 13px; opacity: 0.9; }
          .body { padding: 32px; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .row .label { color: #64748b; font-weight: 500; }
          .row .value { font-weight: 600; }
          .amount { text-align: center; padding: 24px; background: #f0fdf4; margin: 16px 0; border-radius: 8px; }
          .amount .num { font-size: 32px; font-weight: bold; color: #059669; }
          .amount .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          .badge { display: inline-block; background: #059669; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .receipt-id { font-family: monospace; font-size: 13px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Maljae Educational Institutions</h1>
            <p>Fee Payment Receipt</p>
          </div>
          <div class="body">
            <div class="row"><span class="label">Receipt No.</span><span class="value receipt-id">${payment.receipt_id || 'N/A'}</span></div>
            <div class="row"><span class="label">Student Name</span><span class="value">${student.name}</span></div>
            <div class="row"><span class="label">Class</span><span class="value">${student.class}</span></div>
            <div class="row"><span class="label">Category</span><span class="value">${student.category}</span></div>
            <div class="row"><span class="label">Fee Month</span><span class="value">${monthName} ${payment.year}</span></div>
            <div class="row"><span class="label">Payment Date</span><span class="value">${payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span></div>
            <div class="row"><span class="label">Status</span><span class="value"><span class="badge">PAID</span></span></div>
            <div class="amount">
              <div class="num">Rs. ${payment.amount.toLocaleString('en-IN')}</div>
              <div class="label">Amount Paid</div>
            </div>
          </div>
          <div class="footer">
            This is a computer-generated receipt. Please retain for your records.<br/>
            Maljae English Medium Public School & Maljae Ders
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
          URL.revokeObjectURL(url);
        }, 500);
      };
    }
  };

  const shareWhatsApp = (student: Student, payment: FeePayment) => {
    const monthName = MONTH_NAMES[payment.month - 1];
    const phone = student.father_whatsapp || student.mother_whatsapp || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message =
      `*Maljae Educational Institutions*\n` +
      `*Fee Payment Receipt*\n\n` +
      `Receipt No: ${payment.receipt_id || 'N/A'}\n` +
      `Student: ${student.name}\n` +
      `Class: ${student.class}\n` +
      `Fee Month: ${monthName} ${payment.year}\n` +
      `Amount Paid: Rs. ${payment.amount.toLocaleString('en-IN')}\n` +
      `Payment Date: ${payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-IN') : '-'}\n\n` +
      `Status: PAID\n\n` +
      `Thank you for your payment.\n` +
      `Maljae English Medium Public School & Maljae Ders`;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Fee Payments</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">Rs. {totalCollected.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500">Collected ({viewYear})</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">Rs. {totalPending.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500">Pending Dues ({viewYear})</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{STANDARD_FEE}</p>
              <p className="text-xs text-slate-500">Monthly Fee (INR)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Year + Class filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter size={18} />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition">
          <option value="all">All Classes</option>
          {CLASSES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))} className="border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition">
          {Array.from({ length: 5 }, (_, i) => currentAcademicYear - 2 + i).map((y) => (
            <option key={y} value={y}>{y} - {y + 1}</option>
          ))}
        </select>
      </div>

      {/* Student fee cards */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-400">
          No students enrolled.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((s) => {
            const isExpanded = expandedStudent === s.id;
            const dues = pendingAmount(s.id);
            const paidCount = elapsedMonths.filter((m) => { const p = paymentsFor(s.id, viewYear, m); return p && p.paid; }).length;
            const totalMonths = elapsedMonths.length;

            return (
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Student header */}
                <div className="flex items-center justify-between p-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                        <User size={18} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.class} · {s.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${dues > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {dues > 0 ? `Rs. ${dues.toLocaleString('en-IN')} due` : 'All clear'}
                    </span>
                    <span className="text-sm text-slate-500">{paidCount}/{totalMonths} months paid</span>
                    <button
                      onClick={() => setExpandedStudent(isExpanded ? null : s.id)}
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium bg-slate-100 px-3 py-1.5 rounded-lg transition"
                    >
                      {isExpanded ? 'Hide' : 'Months'}
                      <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expandable monthly grid */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {ACADEMIC_MONTHS.map((m) => {
                        const payment = paymentsFor(s.id, viewYear, m);
                        const isPaid = payment && payment.paid;
                        const monthYear = m >= 6 ? viewYear : viewYear + 1;
                        const isCurrent = monthYear === currentYear && m === currentMonth;
                        const isFuture = !elapsedMonths.includes(m);

                        return (
                          <div
                            key={m}
                            className={`rounded-lg border p-2.5 text-center transition ${
                              isPaid
                                ? 'bg-emerald-50 border-emerald-200'
                                : isFuture
                                  ? 'bg-slate-50 border-slate-100 opacity-50'
                                  : 'bg-red-50 border-red-200'
                            } ${isCurrent ? 'ring-2 ring-blue-400' : ''}`}
                          >
                            <p className="text-xs font-semibold text-slate-600">{MONTH_SHORT[m - 1]}</p>
                            <p className={`text-sm font-bold mt-0.5 ${isPaid ? 'text-emerald-600' : isFuture ? 'text-slate-300' : 'text-red-600'}`}>
                              {isPaid ? 'Paid' : isFuture ? '—' : 'Due'}
                            </p>
                            <div className="mt-1.5 flex items-center justify-center gap-1">
                              {isPaid ? (
                                <>
                                  <button
                                    onClick={() => generateReceipt(s, payment!)}
                                    className="text-emerald-600 hover:text-emerald-700 p-1 rounded transition"
                                    title="Download Receipt"
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    onClick={() => shareWhatsApp(s, payment!)}
                                    className="text-emerald-600 hover:text-emerald-700 p-1 rounded transition"
                                    title="Share on WhatsApp"
                                  >
                                    <Share2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => onTogglePayment(s.id, viewYear, m)}
                                    className="text-slate-400 hover:text-red-500 p-1 rounded transition text-[10px] font-medium"
                                    title="Mark Unpaid"
                                  >
                                    Undo
                                  </button>
                                </>
                              ) : (
                                !isFuture && (
                                  <button
                                    onClick={() => onTogglePayment(s.id, viewYear, m)}
                                    className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-emerald-700 transition"
                                  >
                                    Mark Paid
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- STUDENT FEE SUMMARY (Student / Parent dashboard) ---
function StudentFeeSummary({ studentId, feePayments }: { studentId: string; feePayments: FeePayment[] }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const academicYear = getAcademicYear(now);

  const paymentsFor = (year: number, month: number) =>
    feePayments.find((f) => f.student_id === studentId && f.year === year && f.month === month);

  let pendingCount = 0;
  let pendingAmount = 0;
  let paidCount = 0;

  for (const m of ACADEMIC_MONTHS) {
    const monthYear = m >= 6 ? academicYear : academicYear + 1;
    if (monthYear > currentYear || (monthYear === currentYear && m > currentMonth)) continue;
    const p = paymentsFor(academicYear, m);
    if (p && p.paid) {
      paidCount++;
    } else {
      pendingCount++;
      pendingAmount += STANDARD_FEE;
    }
  }

  const allClear = pendingCount === 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${allClear ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <DollarSign size={20} className={allClear ? 'text-emerald-600' : 'text-red-600'} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{allClear ? 'All Clear' : `Rs. ${pendingAmount.toLocaleString('en-IN')} Pending`}</p>
          <p className="text-xs text-slate-500">Fee Status ({academicYear}-{academicYear + 1})</p>
        </div>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-medium">{paidCount} months paid</span>
        {pendingCount > 0 && (
          <span className="bg-red-50 text-red-700 px-2 py-1 rounded font-medium">{pendingCount} months due</span>
        )}
      </div>
    </div>
  );
}

// --- NOTES MANAGER (Admin) ---
function NotesManager({
  notes,
  noteClass,
  setNoteClass,
  noteSubject,
  setNoteSubject,
  noteTitle,
  setNoteTitle,
  noteLink,
  setNoteLink,
  noteFilePreview,
  onFileSelect,
  onAddNote,
  onToggleApproval,
  uploading,
}: {
  notes: Note[];
  noteClass: string;
  setNoteClass: (v: string) => void;
  noteSubject: string;
  setNoteSubject: (v: string) => void;
  noteTitle: string;
  setNoteTitle: (v: string) => void;
  noteLink: string;
  setNoteLink: (v: string) => void;
  noteFilePreview: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddNote: (e: React.FormEvent) => void;
  onToggleApproval: (noteId: string, currentApproved: boolean) => void;
  uploading: boolean;
}) {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredNotes = notes.filter((n) => {
    if (filterClass !== 'all' && n.class !== filterClass) return false;
    if (filterStatus === 'approved' && !n.approved) return false;
    if (filterStatus === 'pending' && n.approved) return false;
    return true;
  });

  const pendingCount = notes.filter((n) => !n.approved).length;
  const approvedCount = notes.filter((n) => n.approved).length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Notes Upload</h1>

      {/* Upload Form */}
      <form onSubmit={onAddNote} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-emerald-600" /> Upload New Note / File
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Class</label>
            <select value={noteClass} onChange={(e) => setNoteClass(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Subject</label>
            <input type="text" value={noteSubject} onChange={(e) => setNoteSubject(e.target.value)} placeholder="e.g. Maths" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Title</label>
            <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Chapter 1 Notes" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">External Link (optional)</label>
            <input type="url" value={noteLink} onChange={(e) => setNoteLink(e.target.value)} placeholder="https://..." className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Upload File (PDF, DOC, etc.)</label>
            <label className="cursor-pointer group">
              <div className="border-2 border-dashed border-slate-300 group-hover:border-emerald-500 transition rounded-lg p-3 flex items-center gap-3 bg-slate-50">
                <File size={24} className="text-slate-400" />
                <span className="text-sm text-slate-600">
                  {noteFilePreview || 'Choose a file to upload...'}
                </span>
              </div>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls,.jpg,.jpeg,.png" onChange={onFileSelect} className="hidden" />
            </label>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={uploading} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-500 transition font-medium disabled:opacity-50">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {uploading ? 'Uploading...' : 'Upload Note'}
          </button>
          <p className="text-xs text-slate-500">Notes require approval before students can see them.</p>
        </div>
      </form>

      {/* Summary + Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter size={18} />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition">
          <option value="all">All Classes</option>
          {CLASSES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-slate-300 p-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition">
          <option value="all">All Status</option>
          <option value="approved">Approved ({approvedCount})</option>
          <option value="pending">Pending ({pendingCount})</option>
        </select>
      </div>

      {/* Notes List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold mb-4 text-slate-800">Uploaded Notes ({filteredNotes.length})</h3>
        {filteredNotes.length === 0 ? (
          <p className="text-slate-400 text-sm">No notes found. Upload a new note above.</p>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((n) => (
              <div key={n.id} className={`border p-4 rounded-lg flex justify-between items-center transition ${n.approved ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
                <div className="flex items-center gap-3">
                  {n.file_url ? (
                    <File size={24} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <BookOpen size={24} className="text-slate-400 flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-600">{n.class} - {n.subject}</span>
                      {n.approved ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <Check size={12} /> Approved
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold mt-1.5 text-slate-800">{n.title}</h4>
                    {n.file_name && <p className="text-xs text-slate-400 mt-0.5">{n.file_name}</p>}
                    {n.link && <p className="text-xs text-blue-500 mt-0.5">{n.link}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {n.file_url && (
                    <a href={n.file_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      View
                    </a>
                  )}
                  <button
                    onClick={() => onToggleApproval(n.id, n.approved)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      n.approved
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {n.approved ? 'Unapprove' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- NOTES ASSISTANT (Student / Parent) ---
function NotesAssistant({ notes }: { notes: Note[] }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAI = async (payload: Record<string, unknown>) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notes-assistant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.answer as string;
  };

  const buildNoteContext = (note: Note | undefined) => {
    if (!note) return {};
    return {
      noteTitle: note.title,
      noteSubject: note.subject,
      noteClass: note.class,
      fileName: note.file_name,
      fileUrl: note.file_url || undefined,
      fileMimeType: note.file_type || undefined,
    };
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMsg = question.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const note = notes.find((n) => n.id === selectedNoteId);
      const answer = await callAI({
        mode: 'chat',
        question: userMsg,
        ...buildNoteContext(note),
        chatHistory: messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get response';
      setError(msg);
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I could not process your question right now. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (mode: 'summarize' | 'questions') => {
    const note = notes.find((n) => n.id === selectedNoteId);
    const actionLabel = mode === 'summarize' ? 'Summarize this note' : 'Generate practice questions';
    setMessages((prev) => [...prev, { role: 'user', text: actionLabel }]);
    setLoading(true);
    setError(null);

    try {
      const answer = await callAI({
        mode,
        ...buildNoteContext(note),
        chatHistory: messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get response';
      setError(msg);
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I could not process this right now. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
        <Sparkles size={20} className="text-emerald-600" /> AI Study Assistant
      </h3>
      <p className="text-sm text-slate-500 mb-4">Ask questions about your study notes and materials. Select a note for context-specific answers.</p>

      {/* Note selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5 text-slate-700">Select Note (optional)</label>
        <select value={selectedNoteId} onChange={(e) => setSelectedNoteId(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
          <option value="">General question (no specific note)</option>
          {notes.map((n) => (
            <option key={n.id} value={n.id}>{n.title} - {n.subject}</option>
          ))}
        </select>
      </div>

      {/* Quick AI actions */}
      {selectedNoteId && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => handleAction('summarize')}
            disabled={loading}
            className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileText size={14} /> Summarize
          </button>
          <button
            onClick={() => handleAction('questions')}
            disabled={loading}
            className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-100 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <HelpCircle size={14} /> Generate Questions
          </button>
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1 text-xs font-medium text-emerald-600">
                    <Sparkles size={12} /> Assistant
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg p-3 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Thinking...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleAsk} className="flex gap-2">
        <div className="flex-1 relative">
          <MessageCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your notes..."
            className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-1.5 hover:bg-emerald-500 transition font-medium text-sm disabled:opacity-50"
        >
          <Send size={16} /> Ask
        </button>
      </form>

      {error && (
        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

// --- LEAVE MANAGER (Admin) ---
const LEAVE_REASONS = ['Going Home', 'Medical', 'Family Event', 'Emergency', 'Personal Work', 'Other'];

function LeaveManager({
  students,
  leaves,
  monthlyLeaves,
  leaveBalances,
  nonGoers,
  onAddLeave,
  onUpdateLeaveStatus,
  onDeleteLeave,
  onAddMonthlyLeave,
  onDeleteMonthlyLeave,
  onUpdateBalance,
  onAddNonGoer,
  onRemoveNonGoer,
}: {
  students: Student[];
  leaves: Leave[];
  monthlyLeaves: MonthlyLeave[];
  leaveBalances: LeaveBalance[];
  nonGoers: LeaveNonGoer[];
  onAddLeave: (leave: {
    student_id: string;
    leave_type: 'School' | 'Dars';
    reason: string;
    departure_date: string;
    departure_time: string;
    return_date: string;
    return_time: string;
    status: 'approved' | 'pending';
    requested_by: string;
  }) => void;
  onUpdateLeaveStatus: (leaveId: string, status: 'approved' | 'pending' | 'rejected') => void;
  onDeleteLeave: (leaveId: string) => void;
  onAddMonthlyLeave: (ml: {
    year: number;
    month: number;
    leave_type: 'School' | 'Dars';
    title: string;
    start_date: string;
    end_date: string;
  }) => void;
  onDeleteMonthlyLeave: (id: string) => void;
  onUpdateBalance: (balanceId: string, updates: Partial<LeaveBalance>) => void;
  onAddNonGoer: (monthlyLeaveId: string, studentId: string, notes?: string) => void;
  onRemoveNonGoer: (id: string) => void;
}) {
  const [subTab, setSubTab] = useState<'dashboard' | 'monthly' | 'personal' | 'balances' | 'nongoers'>('dashboard');
  const [filterClass, setFilterClass] = useState<string>('all');

  // Non-goers state
  const [ngMonthlyLeaveId, setNgMonthlyLeaveId] = useState<string>('');
  const [ngStudentSearch, setNgStudentSearch] = useState('');
  const [ngNotes, setNgNotes] = useState('');

  // Personal leave form state
  const [formClass, setFormClass] = useState<string>('all');
  const [formStudent, setFormStudent] = useState<string>('');
  const [formLeaveType, setFormLeaveType] = useState<'School' | 'Dars'>('School');
  const [formReason, setFormReason] = useState('Going Home');
  const [formDepDate, setFormDepDate] = useState('');
  const [formDepTime, setFormDepTime] = useState('08:00');
  const [formRetDate, setFormRetDate] = useState('');
  const [formRetTime, setFormRetTime] = useState('18:00');

  // Monthly leave form state
  const [mlYear, setMlYear] = useState(new Date().getFullYear());
  const [mlMonth, setMlMonth] = useState(new Date().getMonth() + 1);
  const [mlType, setMlType] = useState<'School' | 'Dars'>('School');
  const [mlTitle, setMlTitle] = useState('');
  const [mlStart, setMlStart] = useState('');
  const [mlEnd, setMlEnd] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formStudents = formClass === 'all' ? students : students.filter((s) => s.class === formClass);

  const filteredLeaves = leaves.filter((l) => {
    const stu = students.find((s) => s.id === l.student_id);
    if (!stu) return false;
    if (filterClass !== 'all' && stu.class !== filterClass) return false;
    return true;
  });

  const activeLeaves = filteredLeaves.filter((l) => {
    const dep = new Date(l.departure_date);
    const ret = new Date(l.return_date);
    return l.status === 'approved' && dep <= today && ret >= today;
  });

  const upcomingLeaves = filteredLeaves.filter((l) => {
    const dep = new Date(l.departure_date);
    return l.status === 'approved' && dep > today;
  });

  const pastLeaves = filteredLeaves.filter((l) => {
    const ret = new Date(l.return_date);
    return ret < today;
  });

  const pendingLeaves = filteredLeaves.filter((l) => l.status === 'pending');
  const parentRequests = filteredLeaves.filter((l) => l.status === 'pending' && l.requested_by === 'parent');

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudent || !formDepDate || !formRetDate) return;
    onAddLeave({
      student_id: formStudent,
      leave_type: formLeaveType,
      reason: formReason,
      departure_date: formDepDate,
      departure_time: formDepTime,
      return_date: formRetDate,
      return_time: formRetTime,
      status: 'approved',
      requested_by: 'admin',
    });
    setFormStudent('');
    setFormDepDate('');
    setFormRetDate('');
  };

  const handleMonthlySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mlTitle.trim() || !mlStart || !mlEnd) return;
    onAddMonthlyLeave({
      year: mlYear,
      month: mlMonth,
      leave_type: mlType,
      title: mlTitle,
      start_date: mlStart,
      end_date: mlEnd,
    });
    setMlTitle('');
    setMlStart('');
    setMlEnd('');
  };

  const calcDays = (dep: string, ret: string) => {
    const d1 = new Date(dep);
    const d2 = new Date(ret);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  };

  const filteredStudents = filterClass === 'all' ? students : students.filter((s) => s.class === filterClass);

  const renderStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">Approved</span>;
    if (status === 'pending') return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">Pending</span>;
    return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Rejected</span>;
  };

  const renderLeaveRow = (l: Leave) => {
    const stu = students.find((s) => s.id === l.student_id);
    return (
      <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
        <td className="p-3 font-medium text-slate-800 text-sm">{stu?.name || 'Unknown'}</td>
        <td className="p-3 text-slate-600 text-sm">{stu?.class || '-'}</td>
        <td className="p-3 text-sm">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${l.leave_type === 'School' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
            {l.leave_type}
          </span>
        </td>
        <td className="p-3 text-slate-600 text-sm">{l.reason}</td>
        <td className="p-3 text-slate-600 text-sm">{l.departure_date} {l.departure_time}</td>
        <td className="p-3 text-slate-600 text-sm">{l.return_date} {l.return_time}</td>
        <td className="p-3 text-sm font-semibold text-slate-700">{l.total_days}</td>
        <td className="p-3 text-sm">{renderStatusBadge(l.status)}</td>
        <td className="p-3 text-sm">
          <div className="flex items-center gap-1">
            {l.status !== 'approved' && (
              <button onClick={() => onUpdateLeaveStatus(l.id, 'approved')} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs hover:bg-emerald-500 transition" title="Approve">
                <Check size={12} />
              </button>
            )}
            {l.status !== 'rejected' && (
              <button onClick={() => onUpdateLeaveStatus(l.id, 'rejected')} className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs hover:bg-red-200 transition" title="Reject">
                <XIcon size={12} />
              </button>
            )}
            <button onClick={() => onDeleteLeave(l.id)} className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs hover:bg-slate-200 transition" title="Delete">
              <X size={12} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Leave Management</h1>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'dashboard', label: 'Dashboard', icon: ClipboardList },
          { key: 'monthly', label: 'Monthly Leaves', icon: CalendarPlus },
          { key: 'personal', label: 'Personal Leaves', icon: Plane },
          { key: 'balances', label: 'Leave Balances', icon: TrendingUp },
          { key: 'nongoers', label: 'Non-Goers', icon: UsersRound },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              subTab === key ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Class filter (shared) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter size={18} />
          <span className="text-sm font-medium">Filter by class:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterClass('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterClass === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All
          </button>
          {CLASSES.map((c) => (
            <button key={c} onClick={() => setFilterClass(c)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterClass === c ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD SUB-TAB */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Parent leave request notifications */}
          {parentRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={20} className="text-amber-600" />
                <h3 className="font-bold text-amber-800">Parent Leave Requests ({parentRequests.length})</h3>
              </div>
              <p className="text-sm text-amber-700 mb-3">The following leave requests were submitted by parents and need your review.</p>
              <div className="space-y-2">
                {parentRequests.map((l) => {
                  const stu = students.find((s) => s.id === l.student_id);
                  return (
                    <div key={l.id} className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2">
                      <div className="text-sm">
                        <span className="font-semibold text-slate-800">{stu?.name || 'Unknown'}</span>
                        <span className="text-slate-500 ml-2">{stu?.class || '-'}</span>
                        <span className="text-slate-600 ml-2">— {l.reason}</span>
                        <span className="text-slate-500 ml-2">({l.departure_date} to {l.return_date}, {l.total_days} days)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onUpdateLeaveStatus(l.id, 'approved')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-500 transition flex items-center gap-1">
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => onUpdateLeaveStatus(l.id, 'rejected')} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200 transition flex items-center gap-1">
                          <XIcon size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Plane size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{activeLeaves.length}</p>
                  <p className="text-xs text-slate-500">On Leave Now</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CalendarPlus size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{upcomingLeaves.length}</p>
                  <p className="text-xs text-slate-500">Upcoming</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{pendingLeaves.length}</p>
                  <p className="text-xs text-slate-500">Pending Requests</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <History size={20} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{pastLeaves.length}</p>
                  <p className="text-xs text-slate-500">Past Leaves</p>
                </div>
              </div>
            </div>
          </div>

          {/* Currently on leave */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Plane size={18} className="text-emerald-600" /> Currently On Leave
              </h3>
            </div>
            {activeLeaves.length === 0 ? (
              <p className="p-6 text-center text-slate-400 text-sm">No students currently on leave.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 font-semibold text-slate-700 text-sm">Student</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Class</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Type</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Reason</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Departure</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Return</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLeaves.map(renderLeaveRow)}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming + Pending */}
          {(upcomingLeaves.length > 0 || pendingLeaves.length > 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <CalendarPlus size={18} className="text-blue-600" /> Upcoming & Pending
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 font-semibold text-slate-700 text-sm">Student</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Class</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Type</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Reason</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Departure</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Return</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Days</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Status</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...upcomingLeaves, ...pendingLeaves].map(renderLeaveRow)}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past history */}
          {pastLeaves.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <History size={18} className="text-slate-600" /> Past Leave History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 font-semibold text-slate-700 text-sm">Student</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Class</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Type</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Reason</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Departure</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Return</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Days</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastLeaves.map((l) => {
                      const stu = students.find((s) => s.id === l.student_id);
                      return (
                        <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-3 font-medium text-slate-800 text-sm">{stu?.name || 'Unknown'}</td>
                          <td className="p-3 text-slate-600 text-sm">{stu?.class || '-'}</td>
                          <td className="p-3 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${l.leave_type === 'School' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {l.leave_type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 text-sm">{l.reason}</td>
                          <td className="p-3 text-slate-600 text-sm">{l.departure_date}</td>
                          <td className="p-3 text-slate-600 text-sm">{l.return_date}</td>
                          <td className="p-3 text-sm font-semibold text-slate-700">{l.total_days}</td>
                          <td className="p-3 text-sm">{renderStatusBadge(l.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MONTHLY LEAVES SUB-TAB */}
      {subTab === 'monthly' && (
        <div className="space-y-6">
          <form onSubmit={handleMonthlySubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarPlus size={20} className="text-emerald-600" /> Add Monthly General Leave
            </h2>
            <p className="text-sm text-slate-500 mb-4">This leave applies to ALL students. Unused monthly leave days can be carried forward as extra balance.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Year</label>
                <select value={mlYear} onChange={(e) => setMlYear(Number(e.target.value))} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                  {[2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Month</label>
                <select value={mlMonth} onChange={(e) => setMlMonth(Number(e.target.value))} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                  {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Leave Type</label>
                <select value={mlType} onChange={(e) => setMlType(e.target.value as 'School' | 'Dars')} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                  <option value="School">School Leave</option>
                  <option value="Dars">Ders Leave</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Title</label>
                <input type="text" value={mlTitle} onChange={(e) => setMlTitle(e.target.value)} placeholder="e.g. Summer Break, Eid Holidays" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Start Date</label>
                <input type="date" value={mlStart} onChange={(e) => setMlStart(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">End Date</label>
                <input type="date" value={mlEnd} onChange={(e) => setMlEnd(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-500 transition font-medium">
                <Plus size={18} /> Add Monthly Leave
              </button>
            </div>
          </form>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Monthly General Leaves</h3>
            </div>
            {monthlyLeaves.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">No monthly leaves added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 font-semibold text-slate-700 text-sm">Month/Year</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Type</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Title</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Start</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">End</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Days</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyLeaves.map((ml) => (
                      <tr key={ml.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-700 text-sm font-medium">{MONTH_NAMES[ml.month - 1]} {ml.year}</td>
                        <td className="p-3 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ml.leave_type === 'School' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {ml.leave_type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 text-sm">{ml.title}</td>
                        <td className="p-3 text-slate-600 text-sm">{ml.start_date}</td>
                        <td className="p-3 text-slate-600 text-sm">{ml.end_date}</td>
                        <td className="p-3 text-sm font-semibold text-slate-700">{ml.total_days}</td>
                        <td className="p-3 text-sm">
                          <button onClick={() => onDeleteMonthlyLeave(ml.id)} className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs hover:bg-slate-200 transition" title="Delete">
                            <X size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PERSONAL LEAVES SUB-TAB */}
      {subTab === 'personal' && (
        <div className="space-y-6">
          <form onSubmit={handlePersonalSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Plane size={20} className="text-emerald-600" /> Record Student Leave
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Class</label>
                <select value={formClass} onChange={(e) => { setFormClass(e.target.value); setFormStudent(''); }} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                  <option value="all">All Classes</option>
                  {CLASSES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Student</label>
                <select value={formStudent} onChange={(e) => setFormStudent(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required>
                  <option value="">Select student...</option>
                  {formStudents.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Leave Type</label>
                <select value={formLeaveType} onChange={(e) => setFormLeaveType(e.target.value as 'School' | 'Dars')} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                  <option value="School">School Leave</option>
                  <option value="Dars">Ders Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Reason</label>
                <select value={formReason} onChange={(e) => setFormReason(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                  {LEAVE_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Departure Date</label>
                <input type="date" value={formDepDate} onChange={(e) => setFormDepDate(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Departure Time</label>
                <input type="time" value={formDepTime} onChange={(e) => setFormDepTime(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Return Date</label>
                <input type="date" value={formRetDate} onChange={(e) => setFormRetDate(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Return Time</label>
                <input type="time" value={formRetTime} onChange={(e) => setFormRetTime(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" />
              </div>
              {formDepDate && formRetDate && (
                <div className="flex items-end">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 w-full text-center">
                    <p className="text-xs text-emerald-600 font-medium">Total Days</p>
                    <p className="text-xl font-bold text-emerald-700">{calcDays(formDepDate, formRetDate)}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <button type="submit" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-500 transition font-medium">
                <Plus size={18} /> Record Leave
              </button>
            </div>
          </form>

          {/* All leaves table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">All Personal Leaves ({filteredLeaves.length})</h3>
            </div>
            {filteredLeaves.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">No personal leaves recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 font-semibold text-slate-700 text-sm">Student</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Class</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Type</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Reason</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Departure</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Return</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Days</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Status</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map(renderLeaveRow)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEAVE BALANCES SUB-TAB */}
      {subTab === 'balances' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-700">
              <TrendingUp size={18} className="text-emerald-600" />
              <h3 className="font-semibold">Leave Balance Dashboard</h3>
            </div>
            <p className="text-sm text-slate-500">View and adjust each student's leave balance. Use the "Extra" and "Held" columns to manage carry-forward and late-return penalties.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3 font-semibold text-slate-700 text-sm">Student</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Class</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Type</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Allocated</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Used</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Carry Fwd</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Extra</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Held</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Remaining</th>
                    <th className="p-3 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={10} className="p-8 text-center text-slate-400">No students found.</td></tr>
                  ) : filteredStudents.map((s) => {
                    const schoolBal = leaveBalances.find((b) => b.student_id === s.id && b.leave_type === 'School');
                    const darsBal = leaveBalances.find((b) => b.student_id === s.id && b.leave_type === 'Dars');
                    return (
                      <Fragment key={s.id}>
                        {schoolBal && (
                          <BalanceRow key={schoolBal.id} balance={schoolBal} studentName={s.name} studentClass={s.class} onUpdate={onUpdateBalance} />
                        )}
                        {darsBal && (
                          <BalanceRow key={darsBal.id} balance={darsBal} studentName={s.name} studentClass={s.class} onUpdate={onUpdateBalance} />
                        )}
                        {!schoolBal && !darsBal && (
                          <tr className="border-b border-slate-100">
                            <td className="p-3 font-medium text-slate-800 text-sm">{s.name}</td>
                            <td className="p-3 text-slate-600 text-sm">{s.class}</td>
                            <td colSpan={8} className="p-3 text-slate-400 text-sm">No balance records yet</td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NON-GOERS SUB-TAB */}
      {subTab === 'nongoers' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <UsersRound size={20} className="text-emerald-600" /> Track Non-Goers (Students Staying Back)
            </h2>
            <p className="text-sm text-slate-500 mb-4">Log students who are NOT going home during a monthly general leave. Search by name or ID to add them.</p>

            {/* Select monthly leave */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-slate-700">Select Monthly Leave</label>
              <select value={ngMonthlyLeaveId} onChange={(e) => setNgMonthlyLeaveId(e.target.value)} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
                <option value="">-- Select a monthly leave --</option>
                {monthlyLeaves.map((ml) => (
                  <option key={ml.id} value={ml.id}>{ml.title} ({MONTH_NAMES[ml.month - 1]} {ml.year}) — {ml.start_date} to {ml.end_date}</option>
                ))}
              </select>
            </div>

            {ngMonthlyLeaveId && (
              <>
                {/* Student search */}
                <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Search Student (by name or ID)</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ngStudentSearch}
                    onChange={(e) => setNgStudentSearch(e.target.value)}
                    placeholder="Type student name or custom ID..."
                    className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                {ngStudentSearch.trim() && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    {students
                      .filter((s) => {
                        const q = ngStudentSearch.toLowerCase();
                        return (s.name.toLowerCase().includes(q) || (s.custom_id || '').toLowerCase().includes(q));
                      })
                      .filter((s) => !nonGoers.some((ng) => ng.monthly_leave_id === ngMonthlyLeaveId && ng.student_id === s.id))
                      .slice(0, 8)
                      .map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onAddNonGoer(ngMonthlyLeaveId, s.id, ngNotes || undefined);
                            setNgStudentSearch('');
                            setNgNotes('');
                          }}
                          className="w-full text-left p-2.5 hover:bg-emerald-50 border-b border-slate-100 transition flex items-center gap-2"
                        >
                          <Plus size={14} className="text-emerald-600" />
                          <span className="text-sm font-medium text-slate-700">{s.name}</span>
                          <span className="text-xs text-slate-400">{s.class}</span>
                          {s.custom_id && <span className="text-xs text-slate-400 font-mono">{s.custom_id}</span>}
                        </button>
                      ))}
                    {students
                      .filter((s) => {
                        const q = ngStudentSearch.toLowerCase();
                        return (s.name.toLowerCase().includes(q) || (s.custom_id || '').toLowerCase().includes(q));
                      })
                      .filter((s) => !nonGoers.some((ng) => ng.monthly_leave_id === ngMonthlyLeaveId && ng.student_id === s.id))
                      .length === 0 && (
                      <p className="p-3 text-sm text-slate-400 text-center">No matching students or all already added.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes for non-goer */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5 text-slate-700">Notes (optional)</label>
                <input type="text" value={ngNotes} onChange={(e) => setNgNotes(e.target.value)} placeholder="e.g. Staying with guardian, exam prep..." className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" />
              </div>

              {/* Non-goers list for this monthly leave */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <UsersRound size={16} className="text-slate-600" /> Students Staying Back ({nonGoers.filter((ng) => ng.monthly_leave_id === ngMonthlyLeaveId).length})
                </h3>
                {nonGoers.filter((ng) => ng.monthly_leave_id === ngMonthlyLeaveId).length === 0 ? (
                  <p className="text-sm text-slate-400">No students logged as staying back for this leave yet.</p>
                ) : (
                  <div className="space-y-2">
                    {nonGoers
                      .filter((ng) => ng.monthly_leave_id === ngMonthlyLeaveId)
                      .map((ng) => {
                        const stu = students.find((s) => s.id === ng.student_id);
                        return (
                          <div key={ng.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                            <div className="text-sm">
                              <span className="font-medium text-slate-800">{stu?.name || 'Unknown'}</span>
                              <span className="text-slate-500 ml-2">{stu?.class || '-'}</span>
                              {stu?.custom_id && <span className="text-xs text-slate-400 ml-2 font-mono">{stu.custom_id}</span>}
                              {ng.notes && <p className="text-xs text-slate-500 mt-1">{ng.notes}</p>}
                            </div>
                            <button onClick={() => onRemoveNonGoer(ng.id)} className="bg-red-100 text-red-600 p-1.5 rounded-lg hover:bg-red-200 transition" title="Remove">
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* PDF download button */}
              {nonGoers.filter((ng) => ng.monthly_leave_id === ngMonthlyLeaveId).length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const ml = monthlyLeaves.find((m) => m.id === ngMonthlyLeaveId);
                      if (!ml) return;
                      const stayers = nonGoers.filter((ng) => ng.monthly_leave_id === ngMonthlyLeaveId);
                      const rows = stayers.map((ng, i) => {
                        const stu = students.find((s) => s.id === ng.student_id);
                        return `<tr><td style="padding:8px 12px;border:1px solid #cbd5e1">${i + 1}</td><td style="padding:8px 12px;border:1px solid #cbd5e1">${stu?.name || 'Unknown'}</td><td style="padding:8px 12px;border:1px solid #cbd5e1">${stu?.class || '-'}</td><td style="padding:8px 12px;border:1px solid #cbd5e1">${stu?.custom_id || '-'}</td><td style="padding:8px 12px;border:1px solid #cbd5e1">${ng.notes || '-'}</td></tr>`;
                      }).join('');
                      const html = `<html><head><title>Non-Goers Report - ${ml.title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:40px}.header{background:linear-gradient(135deg,#065f46,#047857);color:white;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px}.header h1{font-size:22px;margin-bottom:4px}.header p{font-size:13px;opacity:0.9}.info{margin-bottom:16px;font-size:14px;color:#475569}.info span{font-weight:600}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#f1f5f9;padding:10px 12px;border:1px solid #cbd5e1;text-align:left;font-size:13px;color:#1e293b}.footer{margin-top:24px;text-align:center;font-size:12px;color:#94a3b8}</style></head><body><div class="header"><h1>Maljae Educational Institutions</h1><p>Non-Goers Report — Students Staying Back</p></div><div class="info"><p><span>Leave:</span> ${ml.title} (${ml.leave_type})</p><p><span>Period:</span> ${ml.start_date} to ${ml.end_date} (${ml.total_days} days)</p><p><span>Total Students Staying:</span> ${stayers.length}</p></div><table><thead><tr><th style="padding:10px 12px;border:1px solid #cbd5e1">No.</th><th style="padding:10px 12px;border:1px solid #cbd5e1">Student Name</th><th style="padding:10px 12px;border:1px solid #cbd5e1">Class</th><th style="padding:10px 12px;border:1px solid #cbd5e1">ID</th><th style="padding:10px 12px;border:1px solid #cbd5e1">Notes</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">Generated on ${new Date().toLocaleDateString('en-IN')} | Maljae English Medium Public School & Maljae Ders</div></body></html>`;
                      const blob = new Blob([html], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const w = window.open(url, '_blank');
                      if (w) { w.onload = () => { setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 500); }; }
                    }}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition font-medium text-sm"
                  >
                    <FileDown size={18} /> Download PDF Report
                  </button>
                </div>
              )}
            </>
          )}
          </div>

          {/* Summary across all monthly leaves */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Non-Goers Summary (All Monthly Leaves)</h3>
            </div>
            {monthlyLeaves.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">No monthly leaves added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 font-semibold text-slate-700 text-sm">Monthly Leave</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Period</th>
                      <th className="p-3 font-semibold text-slate-700 text-sm">Non-Goers Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyLeaves.map((ml) => {
                      const count = nonGoers.filter((ng) => ng.monthly_leave_id === ml.id).length;
                      return (
                        <tr key={ml.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-3 font-medium text-slate-800 text-sm">{ml.title}</td>
                          <td className="p-3 text-slate-600 text-sm">{ml.start_date} to {ml.end_date}</td>
                          <td className="p-3 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                              {count} student{count !== 1 ? 's' : ''}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BalanceRow({
  balance,
  studentName,
  studentClass,
  onUpdate,
}: {
  balance: LeaveBalance;
  studentName: string;
  studentClass: string;
  onUpdate: (balanceId: string, updates: Partial<LeaveBalance>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [extra, setExtra] = useState(balance.extra_days);
  const [held, setHeld] = useState(balance.held_days);
  const [carryFwd, setCarryFwd] = useState(balance.carry_forward);

  const remaining = balance.allocated_days + balance.extra_days + balance.carry_forward - balance.used_days - balance.held_days;

  const handleSave = () => {
    onUpdate(balance.id, { extra_days: extra, held_days: held, carry_forward: carryFwd });
    setEditing(false);
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
      <td className="p-3 font-medium text-slate-800 text-sm">{studentName}</td>
      <td className="p-3 text-slate-600 text-sm">{studentClass}</td>
      <td className="p-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${balance.leave_type === 'School' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
          {balance.leave_type}
        </span>
      </td>
      <td className="p-3 text-slate-600 text-sm">{balance.allocated_days}</td>
      <td className="p-3 text-slate-600 text-sm">{balance.used_days}</td>
      {editing ? (
        <>
          <td className="p-3"><input type="number" value={carryFwd} onChange={(e) => setCarryFwd(Number(e.target.value))} className="border border-slate-300 rounded px-2 py-1 w-16 text-xs" min={0} /></td>
          <td className="p-3"><input type="number" value={extra} onChange={(e) => setExtra(Number(e.target.value))} className="border border-slate-300 rounded px-2 py-1 w-16 text-xs" min={0} /></td>
          <td className="p-3"><input type="number" value={held} onChange={(e) => setHeld(Number(e.target.value))} className="border border-slate-300 rounded px-2 py-1 w-16 text-xs" min={0} /></td>
        </>
      ) : (
        <>
          <td className="p-3 text-slate-600 text-sm">{balance.carry_forward}</td>
          <td className="p-3 text-sm">
            <span className="font-medium text-emerald-600">{balance.extra_days}</span>
          </td>
          <td className="p-3 text-sm">
            {balance.held_days > 0 ? (
              <span className="font-medium text-red-600 flex items-center gap-1">
                <ShieldAlert size={12} /> {balance.held_days}
              </span>
            ) : (
              <span className="text-slate-400">0</span>
            )}
          </td>
        </>
      )}
      <td className="p-3 text-sm">
        <span className={`font-bold ${remaining > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{remaining}</span>
      </td>
      <td className="p-3 text-sm">
        {editing ? (
          <div className="flex gap-1">
            <button onClick={handleSave} className="bg-emerald-600 text-white px-2 py-1 rounded text-xs hover:bg-emerald-500 transition" title="Save">
              <Save size={12} />
            </button>
            <button onClick={() => setEditing(false)} className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs hover:bg-slate-300 transition" title="Cancel">
              <X size={12} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs hover:bg-slate-200 transition flex items-center gap-1">
            <Edit2 size={12} /> Adjust
          </button>
        )}
      </td>
    </tr>
  );
}

// --- STUDENT LEAVE CARD (Student / Parent Portal) ---
function StudentLeaveCard({
  studentId,
  leaves,
  monthlyLeaves,
  leaveBalances,
  onAddLeave,
  canRequest,
}: {
  studentId: string;
  studentClass: string;
  leaves: Leave[];
  monthlyLeaves: MonthlyLeave[];
  leaveBalances: LeaveBalance[];
  onAddLeave: (leave: {
    student_id: string;
    leave_type: 'School' | 'Dars';
    reason: string;
    departure_date: string;
    departure_time: string;
    return_date: string;
    return_time: string;
    status: 'approved' | 'pending';
    requested_by: string;
  }) => void;
  canRequest: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formReason, setFormReason] = useState('Going Home');
  const [formDepDate, setFormDepDate] = useState('');
  const [formDepTime, setFormDepTime] = useState('08:00');
  const [formRetDate, setFormRetDate] = useState('');
  const [formRetTime, setFormRetTime] = useState('18:00');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const myLeaves = leaves.filter((l) => l.student_id === studentId);
  const activeLeaves = myLeaves.filter((l) => {
    const dep = new Date(l.departure_date);
    const ret = new Date(l.return_date);
    return l.status === 'approved' && dep <= today && ret >= today;
  });
  const upcomingLeaves = myLeaves.filter((l) => {
    const dep = new Date(l.departure_date);
    return l.status === 'approved' && dep > today;
  });
  const pastLeaves = myLeaves.filter((l) => {
    const ret = new Date(l.return_date);
    return ret < today;
  });

  const myMonthlyLeaves = monthlyLeaves.filter((ml) => {
    const ret = new Date(ml.end_date);
    return ret >= today;
  });

  const myBalances = leaveBalances.filter((b) => b.student_id === studentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDepDate || !formRetDate) return;
    onAddLeave({
      student_id: studentId,
      leave_type: 'School',
      reason: formReason,
      departure_date: formDepDate,
      departure_time: formDepTime,
      return_date: formRetDate,
      return_time: formRetTime,
      status: 'pending',
      requested_by: 'parent',
    });
    setShowForm(false);
    setFormDepDate('');
    setFormRetDate('');
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">Approved</span>;
    if (status === 'pending') return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">Pending</span>;
    return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Rejected</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
          <Plane size={20} className="text-emerald-600" /> Leave Status
        </h3>
        {canRequest && (
          <button onClick={() => setShowForm(!showForm)} className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-500 transition font-medium flex items-center gap-1.5">
            <Plus size={16} /> Request Leave
          </button>
        )}
      </div>

      {/* Request form */}
      {showForm && canRequest && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h4 className="font-semibold text-sm text-slate-700 mb-3">New Leave Request</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Reason</label>
              <select value={formReason} onChange={(e) => setFormReason(e.target.value)} className="border border-slate-300 p-2 rounded-lg w-full text-sm focus:outline-none focus:border-emerald-500 transition">
                {LEAVE_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Departure Date</label>
              <input type="date" value={formDepDate} onChange={(e) => setFormDepDate(e.target.value)} className="border border-slate-300 p-2 rounded-lg w-full text-sm focus:outline-none focus:border-emerald-500 transition" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Departure Time</label>
              <input type="time" value={formDepTime} onChange={(e) => setFormDepTime(e.target.value)} className="border border-slate-300 p-2 rounded-lg w-full text-sm focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Return Date</label>
              <input type="date" value={formRetDate} onChange={(e) => setFormRetDate(e.target.value)} className="border border-slate-300 p-2 rounded-lg w-full text-sm focus:outline-none focus:border-emerald-500 transition" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Return Time</label>
              <input type="time" value={formRetTime} onChange={(e) => setFormRetTime(e.target.value)} className="border border-slate-300 p-2 rounded-lg w-full text-sm focus:outline-none focus:border-emerald-500 transition" />
            </div>
            {formDepDate && formRetDate && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                <p className="text-xs text-emerald-600 font-medium">Total Days</p>
                <p className="text-lg font-bold text-emerald-700">{Math.max(Math.ceil((new Date(formRetDate).getTime() - new Date(formDepDate).getTime()) / (1000 * 60 * 60 * 24)), 1)}</p>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500 transition">Submit Request</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 transition">Cancel</button>
          </div>
        </form>
      )}

      {/* Leave balances */}
      {myBalances.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {myBalances.map((b) => {
            const remaining = b.allocated_days + b.extra_days + b.carry_forward - b.used_days - b.held_days;
            return (
              <div key={b.id} className={`p-3 rounded-lg border ${b.leave_type === 'School' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-xs font-semibold text-slate-600 mb-1">{b.leave_type} Leave Balance</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">Used: <strong className="text-slate-700">{b.used_days}</strong></span>
                  <span className="text-slate-500">Remaining: <strong className={remaining > 0 ? 'text-emerald-600' : 'text-red-600'}>{remaining}</strong></span>
                  {b.extra_days > 0 && <span className="text-emerald-600 text-xs">+{b.extra_days} extra</span>}
                  {b.held_days > 0 && <span className="text-red-600 text-xs flex items-center gap-0.5"><ShieldAlert size={10} /> {b.held_days} held</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming monthly leaves */}
      {myMonthlyLeaves.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-600 mb-2">Upcoming General Holidays:</p>
          <div className="flex flex-wrap gap-2">
            {myMonthlyLeaves.map((ml) => (
              <span key={ml.id} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
                {ml.title} ({ml.start_date} to {ml.end_date})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active leaves */}
      {activeLeaves.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-1">
            <Check size={14} /> Currently On Leave:
          </p>
          <div className="space-y-2">
            {activeLeaves.map((l) => (
              <div key={l.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                <span className="font-medium text-slate-700">{l.reason}</span>
                <span className="text-slate-500"> — {l.departure_date} to {l.return_date} ({l.total_days} days)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming personal leaves */}
      {upcomingLeaves.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
            <CalendarPlus size={14} /> Upcoming Home Visit:
          </p>
          <div className="space-y-2">
            {upcomingLeaves.map((l) => (
              <div key={l.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <span className="font-medium text-slate-700">{l.reason}</span>
                <span className="text-slate-500"> — {l.departure_date} to {l.return_date} ({l.total_days} days)</span>
                <span className="ml-2">{renderStatusBadge(l.status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave history */}
      {pastLeaves.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1">
            <History size={14} /> Leave History:
          </p>
          <div className="space-y-2">
            {pastLeaves.slice(0, 5).map((l) => (
              <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm flex justify-between items-center">
                <div>
                  <span className="font-medium text-slate-700">{l.reason}</span>
                  <span className="text-slate-500"> — {l.departure_date} to {l.return_date} ({l.total_days} days)</span>
                </div>
                {renderStatusBadge(l.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {myLeaves.length === 0 && activeLeaves.length === 0 && upcomingLeaves.length === 0 && pastLeaves.length === 0 && (
        <p className="text-slate-400 text-sm">No leave records yet.</p>
      )}
    </div>
  );
}

// --- GALLERY MANAGER (Admin) ---
function GalleryManager({
  images,
  onUpload,
  onDelete,
  onReorder,
  uploading,
}: {
  images: GalleryImage[];
  onUpload: (file: File) => void;
  onDelete: (id: string, url: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  uploading: boolean;
}) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Gallery Management</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ImagePlus size={20} className="text-emerald-600" /> Upload New Photo
        </h2>
        <label className="cursor-pointer group">
          <div className="border-2 border-dashed border-slate-300 group-hover:border-emerald-500 transition rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50">
            {uploading ? (
              <>
                <Loader2 size={32} className="text-emerald-600 animate-spin mb-2" />
                <p className="text-sm text-slate-500">Uploading...</p>
              </>
            ) : (
              <>
                <ImagePlus size={32} className="text-slate-400 group-hover:text-emerald-500 transition mb-2" />
                <p className="text-sm text-slate-500">Click to select an image to upload</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP supported</p>
              </>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Camera size={18} className="text-emerald-600" /> Gallery Photos ({sorted.length})
          </h3>
        </div>
        {sorted.length === 0 ? (
          <p className="p-8 text-center text-slate-400 text-sm">No gallery photos yet. Upload images above to display them on the landing page.</p>
        ) : (
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map((img, idx) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200">
                <img src={img.url} alt={img.alt} className="w-full aspect-square object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onReorder(img.id, 'up')}
                      disabled={idx === 0}
                      className="bg-white/90 text-slate-700 p-1.5 rounded-lg hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => onReorder(img.id, 'down')}
                      disabled={idx === sorted.length - 1}
                      className="bg-white/90 text-slate-700 p-1.5 rounded-lg hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(img.id, img.url)}
                      className="bg-red-500/90 text-white p-1.5 rounded-lg hover:bg-red-500 transition ml-auto"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <p className="text-sm text-slate-500 mt-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-500" />
          These photos appear on the landing page gallery. Use the arrows to reorder. The first photo is displayed as the large feature image.
        </p>
      )}
    </div>
  );
}

// --- STAFF MANAGER (Admin) ---
function StaffManager({
  staff,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  addStaffError,
  newStaffName,
  setNewStaffName,
  newStaffUsername,
  setNewStaffUsername,
  newStaffPassword,
  setNewStaffPassword,
  newStaffRole,
  setNewStaffRole,
  editingStaffId,
  setEditingStaffId,
  editStaffDraft,
  setEditStaffDraft,
  staffSearch,
  setStaffSearch,
}: {
  staff: Staff[];
  onAddStaff: (e: React.FormEvent) => void;
  onUpdateStaff: (staffId: string) => void;
  onDeleteStaff: (staffId: string) => void;
  addStaffError: string | null;
  newStaffName: string;
  setNewStaffName: (val: string) => void;
  newStaffUsername: string;
  setNewStaffUsername: (val: string) => void;
  newStaffPassword: string;
  setNewStaffPassword: (val: string) => void;
  newStaffRole: 'admin' | 'staff';
  setNewStaffRole: (val: 'admin' | 'staff') => void;
  editingStaffId: string | null;
  setEditingStaffId: (val: string | null) => void;
  editStaffDraft: { name: string; username: string; password: string; role: 'admin' | 'staff' };
  setEditStaffDraft: (val: { name: string; username: string; password: string; role: 'admin' | 'staff' }) => void;
  staffSearch: string;
  setStaffSearch: (val: string) => void;
}) {
  const startEdit = (s: Staff) => {
    setEditingStaffId(s.id);
    setEditStaffDraft({ name: s.name, username: s.username, password: s.password, role: s.role });
  };

  const filteredStaff = staffSearch.trim()
    ? staff.filter((s) =>
        s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.username.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.role.toLowerCase().includes(staffSearch.toLowerCase())
      )
    : staff;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Staff Management</h1>

      <form onSubmit={onAddStaff} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-emerald-600" /> Add New Staff Member
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="e.g. John Doe" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Username <span className="text-red-500">*</span></label>
            <input type="text" value={newStaffUsername} onChange={(e) => setNewStaffUsername(e.target.value)} placeholder="e.g. john_doe" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Password <span className="text-red-500">*</span></label>
            <input type="text" value={newStaffPassword} onChange={(e) => setNewStaffPassword(e.target.value)} placeholder="Enter password" className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700">Role</label>
            <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value as 'admin' | 'staff')} className="border border-slate-300 p-2.5 rounded-lg w-full focus:outline-none focus:border-emerald-500 transition">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        {addStaffError && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <AlertCircle size={16} /> {addStaffError}
          </div>
        )}
        <div className="mt-4">
          <button type="submit" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-500 transition font-medium">
            <Plus size={18} /> Add Staff Member
          </button>
        </div>
      </form>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          value={staffSearch}
          onChange={(e) => setStaffSearch(e.target.value)}
          placeholder="Search staff by name, username, or role..."
          className="flex-1 border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
        />
        {staffSearch && (
          <button onClick={() => setStaffSearch('')} className="text-slate-400 hover:text-slate-600 text-sm">Clear</button>
        )}
        <span className="text-sm text-slate-500 whitespace-nowrap">{filteredStaff.length} of {staff.length}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-700">Name</th>
                <th className="p-4 font-semibold text-slate-700">Username</th>
                <th className="p-4 font-semibold text-slate-700">Password</th>
                <th className="p-4 font-semibold text-slate-700">Role</th>
                <th className="p-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No staff members found.{staffSearch && ' Try a different search.'}</td></tr>
              ) : filteredStaff.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-800">
                    {editingStaffId === s.id ? (
                      <input value={editStaffDraft.name} onChange={(e) => setEditStaffDraft({ ...editStaffDraft, name: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-sm" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                          <UserCog size={16} className="text-slate-500" />
                        </div>
                        {s.name}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm font-mono text-slate-600">
                    {editingStaffId === s.id ? (
                      <input value={editStaffDraft.username} onChange={(e) => setEditStaffDraft({ ...editStaffDraft, username: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-sm" />
                    ) : s.username}
                  </td>
                  <td className="p-4 text-sm font-mono text-slate-600">
                    {editingStaffId === s.id ? (
                      <input value={editStaffDraft.password} onChange={(e) => setEditStaffDraft({ ...editStaffDraft, password: e.target.value })} className="border border-slate-300 rounded px-2 py-1 w-full text-sm" />
                    ) : s.password}
                  </td>
                  <td className="p-4 text-sm">
                    {editingStaffId === s.id ? (
                      <select value={editStaffDraft.role} onChange={(e) => setEditStaffDraft({ ...editStaffDraft, role: e.target.value as 'admin' | 'staff' })} className="border border-slate-300 rounded px-2 py-1 text-sm">
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {s.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingStaffId === s.id ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => onUpdateStaff(s.id)} className="bg-emerald-600 text-white p-1.5 rounded-lg hover:bg-emerald-500 transition" title="Save">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setEditingStaffId(null)} className="bg-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-300 transition" title="Cancel">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button onClick={() => startEdit(s)} className="bg-slate-100 text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDeleteStaff(s.id)} className="bg-red-100 text-red-600 p-1.5 rounded-lg hover:bg-red-200 transition" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-slate-500 mt-4 flex items-center gap-2">
        <CheckCircle size={16} className="text-emerald-500" />
        Staff members can log in through the "Staff / Admin" portal on the landing page using their username and password. Admins have access to the Staff Management section; regular staff do not.
      </p>
    </div>
  );
}