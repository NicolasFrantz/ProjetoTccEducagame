import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

import { db } from '../firebaseConfig';
import { User, Quiz, QuizResult, SchoolClass } from '../types';

const USERS_COLLECTION = 'users';
const QUIZZES_COLLECTION = 'quizzes';
const RESULTS_COLLECTION = 'results';
const CLASSES_COLLECTION = 'classes';

export const dataService = {
  /* =====================
     USERS
  ===================== */

  async getUsers(): Promise<User[]> {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<User, 'id'>)
    }));
  },

  async getUserById(userId: string): Promise<User | null> {
    const ref = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<User, 'id'>) };
  },

  async saveUser(user: User): Promise<void> {
    const ref = doc(db, USERS_COLLECTION, user.id);
    await setDoc(ref, user, { merge: true });
  },

  async deleteStudent(userId: string): Promise<void> {
    // remove resultados do aluno
    const q = query(
      collection(db, RESULTS_COLLECTION),
      where('studentId', '==', userId)
    );

    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

    // remove aluno
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  },

  /* =====================
     QUIZZES
  ===================== */

  async getQuizzes(): Promise<Quiz[]> {
    const snap = await getDocs(collection(db, QUIZZES_COLLECTION));
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Quiz, 'id'>)
    }));
  },

  async saveQuiz(quiz: Quiz): Promise<void> {
    const ref = doc(db, QUIZZES_COLLECTION, quiz.id);
    await setDoc(
      ref,
      {
        ...quiz,
        createdAt: quiz.createdAt
          ? Timestamp.fromMillis(quiz.createdAt)
          : Timestamp.now()
      },
      { merge: true }
    );
  },

  async deleteQuiz(quizId: string): Promise<void> {
    const q = query(
      collection(db, RESULTS_COLLECTION),
      where('quizId', '==', quizId)
    );

    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

    await deleteDoc(doc(db, QUIZZES_COLLECTION, quizId));
  },

  /* =====================
     RESULTS
  ===================== */

  async getResults(): Promise<QuizResult[]> {
    const snap = await getDocs(collection(db, RESULTS_COLLECTION));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...(data as Omit<QuizResult, 'id' | 'date'>),
        date: Date.now()
      };
    });
  },

  async saveResult(result: Omit<QuizResult, 'id'>): Promise<void> {
    await addDoc(collection(db, RESULTS_COLLECTION), {
      ...result,
      date: Timestamp.now()
    });
  },

  /* =====================
     CLASSES
  ===================== */

  async getClasses(): Promise<SchoolClass[]> {
    const snap = await getDocs(collection(db, CLASSES_COLLECTION));
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<SchoolClass, 'id'>)
    }));
  },

  async saveClass(classGroup: SchoolClass): Promise<void> {
    const ref = doc(db, CLASSES_COLLECTION, classGroup.id);
    await setDoc(ref, classGroup, { merge: true });
  },

  async deleteClass(classId: string): Promise<void> {
    await deleteDoc(doc(db, CLASSES_COLLECTION, classId));
  }
};
