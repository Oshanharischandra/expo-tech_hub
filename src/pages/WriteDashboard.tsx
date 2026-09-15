import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Event, ImportantDate } from '../types/payload';
import { eventsService } from '../services/eventsService';
import { storageService } from '../services/storageService';
import TiptapEditor from '../components/write/TiptapEditor';
import { useToast } from '../hooks/useToast';

const WriteDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [currentEvent, setCurrentEvent] = useState<Partial<Event> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  
  const defaultTags = ['Robotics', 'IoT', 'Hackathon', 'AI', 'UI/UX'];
  const eventCategories = ['Workshops', 'Competitions', 'Meetups'];

  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.id) {
      loadMyEvents();
    }
  }, [authState.isAuthenticated, authState.user?.id]);

  const loadMyEvents = async () => {
    setLoading(true);
    try {
      const events = await eventsService.listMyEvents(authState.user!.id);
      setMyEvents(events);
    } catch (error) {
      console.error('Failed to load events:', error);
      showError('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setCurrentEvent({
      title: '',
      description: '',
      tags: [],
      important_dates: [],
      category: 'Workshops',
    });
    setActiveView('form');
  };

  const handleEdit = (event: Event) => {
    setCurrentEvent(event);
    setActiveView('form');
  };

  const handleEventDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    if (!dateStr) {
      setCurrentEvent(prev => prev ? { ...prev, event_date: undefined } : null);
      return;
    }
    
    const isoStr = new Date(dateStr).toISOString();
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const newEvent = { ...prev, event_date: isoStr };
      if (!prev.important_dates || prev.important_dates.length === 0) {
        newEvent.important_dates = [{
          label: 'Event Date',
          date_value: isoStr,
          is_primary: true
        }];
      }
      return newEvent;
    });
  };

  const processImageUpload = async (file: File) => {
    setUploadingImage(true);
    setUploadComplete(false);
    try {
      const result = await storageService.uploadImage(file, 'events');
      setCurrentEvent(prev => prev ? { ...prev, cover_image: result.url } : null);
      setUploadComplete(true);
      showSuccess('Cover image uploaded successfully');
      setTimeout(() => setUploadComplete(false), 3000);
    } catch (error: any) {
      console.error('Image upload failed:', error);
      showError(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processImageUpload(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processImageUpload(file);
    } else if (file) {
      showError('Please upload a valid image file');
    }
  };

  const handleRemoveImage = async () => {
    if (!currentEvent?.cover_image) return;
    try {
      const urlParts = currentEvent.cover_image.split('/events/');
      if (urlParts.length > 1) {
        await storageService.deleteImage(urlParts[1]);
      }
    } catch (e) {
      console.error('Failed to delete image from storage:', e);
    }
    setCurrentEvent(prev => prev ? { ...prev, cover_image: undefined } : null);
  };

  const toggleTag = (tag: string) => {
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const currentTags = prev.tags || [];
      if (currentTags.includes(tag)) {
        return { ...prev, tags: currentTags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...currentTags, tag] };
      }
    });
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = customTagInput.trim();
      if (newTag) {
        setCurrentEvent(prev => {
          if (!prev) return prev;
          const currentTags = prev.tags || [];
          if (!currentTags.includes(newTag)) {
            return { ...prev, tags: [...currentTags, newTag] };
          }
          return prev;
        });
        setCustomTagInput('');
      }
    }
  };

  const addImportantDate = () => {
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const newDate: ImportantDate = { label: '', date_value: '', is_primary: false };
      return { ...prev, important_dates: [...(prev.important_dates || []), newDate] };
    });
  };

  const removeImportantDate = (index: number) => {
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const dates = [...(prev.important_dates || [])];
      dates.splice(index, 1);
      return { ...prev, important_dates: dates };
    });
  };

  const updateImportantDate = (index: number, field: keyof ImportantDate, value: any) => {
    setCurrentEvent(prev => {
      if (!prev) return prev;
      const dates = [...(prev.important_dates || [])];
      
      if (field === 'is_primary' && value === true) {
        dates.forEach(d => d.is_primary = false);
      }
      
      dates[index] = { ...dates[index], [field]: value };
      return { ...prev, important_dates: dates };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent?.title || !currentEvent.description || !currentEvent.event_date || !currentEvent.venue) {
      showError('Please fill out all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (currentEvent.id) {
        await eventsService.updateEvent(currentEvent.id, currentEvent);
        showSuccess('Event updated successfully! It is now pending OC review.');
      } else {
        await eventsService.submitEvent(currentEvent, authState.user!.id);
        showSuccess('Event submitted successfully! It is now pending OC review.');
      }
      setActiveView('list');
      loadMyEvents();
    } catch (error) {
      console.error('Submission failed:', error);
      showError('Failed to submit event');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to start</h1>
          <p className="text-gray-400">Sign in to submit and manage your events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 px-4 py-8">
      <div className="max-w-4xl mx-auto w-full">
        {activeView === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-bold text-white">Your Submitted Events</h1>
              <button 
                onClick={handleStartNew}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                Start New Event
              </button>
            </div>

            {loading ? (
              <p className="text-gray-400">Loading events...</p>
            ) : myEvents.length > 0 ? (
              <div className="grid gap-4">
                {myEvents.map(event => (
                  <div key={event.id} className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">{event.title}</h3>
                      <p className="text-sm text-gray-400">
                        Date: {new Date(event.event_date).toLocaleDateString()} | Venue: {event.venue}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                        event.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                        event.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {event.status}
                      </span>
                      <button 
                        onClick={() => handleEdit(event)}
                        className="text-primary-400 hover:text-primary-300 font-medium text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-900 border border-dark-800 rounded-xl p-8 text-center">
                <p className="text-gray-400 mb-4">You haven't submitted any events yet.</p>
                <button 
                  onClick={handleStartNew}
                  className="text-primary-400 font-bold hover:underline"
                >
                  Create your first event
                </button>
              </div>
            )}
          </div>
        )}

        {activeView === 'form' && currentEvent && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-bold text-white">
                {currentEvent.id ? 'Edit Event' : 'New Event'}
              </h1>
              <button 
                onClick={() => setActiveView('list')}
                className="text-gray-400 hover:text-white font-medium transition-colors"
              >
                Back to List
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-dark-900 border border-dark-800 rounded-xl p-6 space-y-6">
              
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Category *</label>
                <div className="flex flex-wrap gap-4">
                  {eventCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCurrentEvent({ ...currentEvent, category: cat })}
                      className={`px-6 py-2 rounded-lg font-bold border transition-colors ${
                        currentEvent.category === cat
                        ? 'bg-primary-900/50 text-primary-400 border-primary-500/50'
                        : 'bg-dark-950 text-gray-400 border-dark-700 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Flyer / Cover Image</label>
                {currentEvent.cover_image ? (
                  <div className="relative w-full h-64 bg-dark-950 rounded-lg overflow-hidden border border-dark-700 mb-2 group">
                    <img src={currentEvent.cover_image} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-dark-950/20" />
                    
                    {uploadComplete && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="bg-dark-900/90 text-green-400 font-bold px-4 py-2 rounded-lg border border-green-500/30">
                          [ Upload Complete ]
                        </span>
                      </div>
                    )}

                    <button 
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-4 right-4 bg-dark-900 text-red-400 border border-red-500/30 w-8 h-8 flex items-center justify-center rounded-lg font-mono text-xl font-bold hover:bg-red-900/50 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                      title="Remove Image"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors relative ${
                      isDragging 
                        ? 'border-primary-500 bg-primary-900/10' 
                        : uploadingImage 
                          ? 'border-dark-700 bg-dark-900'
                          : 'border-dark-700 bg-dark-950 hover:border-gray-500 hover:bg-dark-900'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={uploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    
                    {uploadingImage ? (
                      <div className="text-primary-400 font-bold animate-pulse">
                        [ Uploading image... ]
                      </div>
                    ) : isDragging ? (
                      <div className="text-primary-400 font-bold">
                        [ Drop image here ]
                      </div>
                    ) : (
                      <div className="text-gray-400 font-bold text-center pointer-events-none">
                        <span className="text-white block mb-2 text-base">[ Click to Browse or Drag & Drop ]</span>
                        <span className="text-xs">Supports JPG, PNG, WEBP</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Title *</label>
                <input
                  type="text"
                  required
                  value={currentEvent.title || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                  placeholder="e.g., Annual Tech Hackathon"
                  className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              {/* Description (Tiptap) */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Event Description *</label>
                <div className="border border-dark-700 rounded-lg overflow-hidden bg-dark-950">
                  <TiptapEditor
                    value={currentEvent.description || ''}
                    onChange={(html) => setCurrentEvent({ ...currentEvent, description: html })}
                    placeholder="Describe your event..."
                    className="prose-invert max-w-none p-4 min-h-[200px] outline-none"
                  />
                </div>
              </div>

              {/* Standard Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={currentEvent.event_date ? new Date(currentEvent.event_date).toISOString().slice(0, 16) : ''}
                    onChange={handleEventDateChange}
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Venue *</label>
                  <input
                    type="text"
                    required
                    value={currentEvent.venue || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, venue: e.target.value })}
                    placeholder="e.g., Main Auditorium"
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Registration Link</label>
                  <input
                    type="url"
                    value={currentEvent.registration_link || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, registration_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Max Team Size</label>
                  <input
                    type="number"
                    min="1"
                    value={currentEvent.max_team_size || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, max_team_size: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 4"
                    className="w-full bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Important Dates */}
              <div className="border-t border-dark-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-bold text-gray-300">Important Dates</label>
                  <button 
                    type="button" 
                    onClick={addImportantDate}
                    className="text-primary-400 hover:text-primary-300 text-sm font-bold"
                  >
                    + Add Date
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(currentEvent.important_dates || []).map((date, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-dark-950 p-4 rounded-lg border border-dark-700">
                      <div className="w-full md:flex-1">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Label</label>
                        <input
                          type="text"
                          required
                          value={date.label}
                          onChange={(e) => updateImportantDate(index, 'label', e.target.value)}
                          placeholder="e.g., Registration Deadline"
                          className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-primary-500 outline-none text-sm"
                        />
                      </div>
                      <div className="w-full md:flex-1">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={date.date_value ? new Date(date.date_value).toISOString().slice(0, 16) : ''}
                          onChange={(e) => updateImportantDate(index, 'date_value', new Date(e.target.value).toISOString())}
                          className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-primary-500 outline-none text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-4 pb-2">
                        <button
                          type="button"
                          onClick={() => updateImportantDate(index, 'is_primary', !date.is_primary)}
                          className={`text-sm font-bold ${date.is_primary ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          {date.is_primary ? '[x] Primary' : '[ ] Primary'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImportantDate(index)}
                          className="text-red-400 hover:text-red-300 text-sm font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!currentEvent.important_dates || currentEvent.important_dates.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No important dates added.</p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="border-t border-dark-800 pt-6">
                <label className="block text-sm font-bold text-gray-300 mb-2">Tags</label>
                
                {/* Selected Tags Display */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(currentEvent.tags || []).map(tag => (
                    <span
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 rounded text-sm font-bold border bg-primary-900/30 text-primary-400 border-primary-500/30 cursor-pointer hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/30 transition-colors flex items-center gap-2"
                      title="Click to remove"
                    >
                      {tag} <span className="font-mono">x</span>
                    </span>
                  ))}
                  {(!currentEvent.tags || currentEvent.tags.length === 0) && (
                    <span className="text-sm text-gray-500">No tags selected.</span>
                  )}
                </div>

                {/* Suggestions */}
                <div className="mb-4">
                  <span className="text-xs text-gray-400 mr-3">Suggestions:</span>
                  <div className="inline-flex flex-wrap gap-2">
                    {defaultTags.map(tag => {
                      if ((currentEvent.tags || []).includes(tag)) return null;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="px-2 py-1 rounded text-xs font-bold border bg-dark-950 text-gray-400 border-dark-700 hover:text-white transition-colors"
                        >
                          + {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Tag Input */}
                <div>
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                    placeholder="Type a custom tag and press Enter..."
                    className="w-full md:w-1/2 bg-dark-950 border border-dark-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Submit Actions */}
              <div className="pt-6 border-t border-dark-800 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="px-6 py-2 rounded-lg font-bold text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Event'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteDashboard;