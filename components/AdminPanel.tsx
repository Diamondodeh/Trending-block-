
// Added React and hook imports
import React, { useState, useEffect, useRef } from 'react';
import { Movie, User, UserRole, Category } from '../types';
import AuthService from '../services/auth';
import { GENRES } from '../constants';
// Added missing icon imports from lucide-react
import { Shield, Upload, UserPlus, LayoutGrid, X, Save, User as UserIcon, Edit2, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  onAddMovie: (movie: Movie) => void;
  onUpdateMovie: (movie: Movie) => void;
  movies: Movie[];
  onDeleteMovie: (id: string) => void;
  currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddMovie, onUpdateMovie, movies, onDeleteMovie, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'users' | 'manage'>('upload');
  const [users, setUsers] = useState<User[]>([]);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Movie' as Category,
    thumbnail: '',
    videoUrl: '',
    genres: [] as string[],
    year: 2024
  });

  useEffect(() => {
    setUsers(AuthService.getAllUsers());
  }, []);

  const handleRoleChange = (userId: string, role: UserRole) => {
    AuthService.updateUserRole(userId, role);
    setUsers(AuthService.getAllUsers());
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Movie',
      thumbnail: '',
      videoUrl: '',
      genres: [],
      year: 2024
    });
    setEditingMovie(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit for LocalStorage health
        alert("Image too large. Please use a file under 2MB for local storage performance.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.thumbnail) {
      alert("Please upload a thumbnail image.");
      return;
    }

    if (editingMovie) {
      const updatedMovie: Movie = {
        ...editingMovie,
        ...formData
      };
      onUpdateMovie(updatedMovie);
      alert('Content Updated Successfully!');
    } else {
      const newMovie: Movie = {
        ...formData,
        id: Date.now().toString(),
        rating: 5.0,
        isTrending: false
      };
      onAddMovie(newMovie);
      alert('Content Added Successfully!');
    }
    resetForm();
    if (editingMovie) setActiveTab('manage');
  };

  const handleEditClick = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      category: movie.category,
      thumbnail: movie.thumbnail,
      videoUrl: movie.videoUrl,
      genres: movie.genres,
      year: movie.year
    });
    setActiveTab('upload');
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) 
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  return (
    <div className="pb-24 px-4 pt-4 min-h-screen bg-black">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-gold" />
        <h1 className="text-2xl font-luxury font-bold gold-text-gradient">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-charcoal rounded-xl p-1 mb-8">
        <button 
          onClick={() => { resetForm(); setActiveTab('upload'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'upload' ? 'bg-gold text-black font-bold' : 'text-gray-400 hover:text-white'}`}
        >
          {editingMovie ? <Edit2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />} {editingMovie ? 'Editing' : 'Upload'}
        </button>
        {currentUser.role === 'MAIN_ADMIN' && (
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'users' ? 'bg-gold text-black font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            <UserPlus className="w-4 h-4" /> Users
          </button>
        )}
        <button 
          onClick={() => setActiveTab('manage')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${activeTab === 'manage' ? 'bg-gold text-black font-bold' : 'text-gray-400 hover:text-white'}`}
        >
          <LayoutGrid className="w-4 h-4" /> Content
        </button>
      </div>

      {activeTab === 'upload' && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingMovie ? `Editing: ${editingMovie.title}` : 'Upload New Content'}
            </h2>
            {editingMovie && (
              <button 
                type="button" 
                onClick={resetForm}
                className="text-[10px] text-red-500 font-bold uppercase tracking-widest border border-red-500/20 px-2 py-1 rounded"
              >
                Cancel Edit
              </button>
            )}
          </div>
          
          <div>
            <label className="block text-xs text-gold uppercase tracking-widest mb-2">Movie Title</label>
            <input 
              required
              className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-white"
              placeholder="e.g. Inception 2"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs text-gold uppercase tracking-widest mb-2">Description</label>
            <textarea 
              required
              className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors h-24 resize-none text-white"
              placeholder="Movie synopsis..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gold uppercase tracking-widest mb-2">Category</label>
              <select 
                className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-white"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                <option value="Movie">Movie</option>
                <option value="Series">Series</option>
                <option value="Anime">Anime</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gold uppercase tracking-widest mb-2">Year</label>
              <input 
                type="number"
                className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-white"
                value={formData.year}
                onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
              />
            </div>
          </div>

          {/* New Luxury Image Upload Component */}
          <div>
            <label className="block text-xs text-gold uppercase tracking-widest mb-2">Movie Poster (Thumbnail)</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            
            {formData.thumbnail ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gold/30 shadow-2xl group">
                <img src={formData.thumbnail} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gold text-black px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest"
                   >
                     Change Photo
                   </button>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-charcoal/50 hover:bg-charcoal hover:border-gold/50 cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gold/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-gold" />
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Select Movie Poster</p>
                <p className="text-[10px] text-gray-600 mt-2 font-medium">PNG, JPG, or WEBP (Max 2MB)</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gold uppercase tracking-widest mb-2">Video Source URL (MP4 Link)</label>
            <input 
              required
              className="w-full bg-charcoal border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors text-white font-mono text-sm"
              placeholder="https://commondatastorage.googleapis.com/..."
              value={formData.videoUrl}
              onChange={e => setFormData({...formData, videoUrl: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs text-gold uppercase tracking-widest mb-2">Genres</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button 
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all border ${formData.genres.includes(g) ? 'bg-gold border-gold text-black font-black' : 'bg-transparent border-white/20 text-gray-400 font-bold'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full gold-gradient py-4 rounded-xl font-bold text-black shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em]">
            {editingMovie ? <><Save className="w-5 h-5" /> Update Content</> : <><Upload className="w-5 h-5" /> Publish to Grid</>}
          </button>
        </form>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {users.map(user => (
            <div key={user.id} className="bg-charcoal border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/30">
                  <UserIcon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{user.name}</h3>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  disabled={user.email === 'jd1680711@gmail.com'}
                  className="bg-black text-[10px] border border-white/20 rounded px-2 py-1 outline-none text-gold uppercase font-bold disabled:opacity-50"
                  value={user.role}
                  onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MAIN_ADMIN">Main Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {movies.map(movie => (
            <div key={movie.id} className="bg-charcoal border border-white/5 rounded-xl overflow-hidden flex h-32 group">
              <div className="w-24 h-full relative shrink-0">
                <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gold truncate">{movie.title}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{movie.category} • {movie.year}</p>
                </div>
                <div className="flex self-end gap-2">
                  <button 
                    onClick={() => handleEditClick(movie)}
                    className="p-2 text-gold hover:bg-gold/10 rounded-full transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDeleteMovie(movie.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {movies.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm italic">The master grid is currently void of content.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
