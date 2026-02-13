/**
 * Voice recorder hook for Safe Journal
 * Uses MediaRecorder API for audio capture
 */

import { useState, useCallback, useRef } from 'react';
import { encryptBlob, decryptBlob } from '../services/crypto';
import { saveAudioNote, getAudioNotes, deleteAudioNote, type AudioNote } from '../services/storage';
import { useAuth } from './useAuth';
import type { DecryptedAudioNote } from '../types';

export function useVoiceRecorder(entryId?: string) {
    const { getKey } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [audioNotes, setAudioNotes] = useState<DecryptedAudioNote[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<number | null>(null);

    // Load audio notes for entry
    const loadAudioNotes = useCallback(async () => {
        if (!entryId) return;
        try {
            const key = getKey();
            const notes = await getAudioNotes(entryId);

            const decrypted: DecryptedAudioNote[] = await Promise.all(
                notes.map(async (note) => {
                    const audioBlob = await decryptBlob(note.encryptedData, key, 'audio/webm');
                    return {
                        id: note.id,
                        entryId: note.entryId,
                        audioBlob,
                        duration: note.duration,
                        createdAt: note.createdAt,
                    };
                })
            );

            setAudioNotes(decrypted);
        } catch (e) {
            console.error('Failed to load audio notes:', e);
        }
    }, [entryId, getKey]);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

                if (entryId) {
                    // Logic for existing entry: Save immediately
                    try {
                        const key = getKey();
                        const encryptedData = await encryptBlob(blob, key);

                        const note: AudioNote = {
                            id: crypto.randomUUID(),
                            entryId,
                            encryptedData,
                            duration,
                            createdAt: Date.now(),
                        };

                        await saveAudioNote(note);
                        await loadAudioNotes();
                    } catch (e) {
                        console.error('Failed to save audio:', e);
                    }
                } else {
                    // Logic for new entry: Keep in state
                    setAudioBlob(blob);
                }

                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            startTimeRef.current = Date.now();
            setCurrentTime(0);

            // Start timer
            timerRef.current = window.setInterval(() => {
                setCurrentTime(Math.round((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

            mediaRecorder.start();
            setIsRecording(true);
        } catch (e) {
            console.error('Failed to start recording:', e);
        }
    }, [entryId, getKey, loadAudioNotes]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    // Delete audio note
    const deleteNote = useCallback(async (id: string) => {
        await deleteAudioNote(id);
        setAudioNotes((prev) => prev.filter((n) => n.id !== id));
    }, []);

    // Format time as mm:ss
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Clear recorded audio (draft)
    const clearAudio = useCallback(() => {
        setAudioBlob(null);
        chunksRef.current = [];
    }, []);

    return {
        isRecording,
        audioNotes,
        audioBlob,
        currentTime,
        formattedTime: formatTime(currentTime),
        startRecording,
        stopRecording,
        clearAudio,
        loadAudioNotes,
        deleteNote,
        formatTime,
    };
}
