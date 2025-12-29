
import React, { useState, useEffect, useMemo } from 'react';
import { Home, Search, LayoutGrid, Download as DownloadIcon, User as UserIcon, Play, Star, ChevronRight, Settings, LogOut, ChevronLeft, Filter, Upload, Shield, X, HardDrive, Check, Menu, Trash2, UserPlus, Timer } from 'lucide-react';
import { Movie, User, Download, LocalFile, Category } from './types';
import { INITIAL_MOVIES, GENRES, YEARS, QUALITIES } from './constants';
import AuthService from './services/auth';
import LocalStorageService from './services/db';
import MediaPlayer from './components/MediaPlayer';
import AdminPanel from './components/AdminPanel';
import AdBlock from './components/AdBlock';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'downloads' | 'profile' | 'admin'>('home');
  const [assetTab, setAssetTab] = useState<'queue' | 'library'>('queue');
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUser());
  const [movies, setMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [downloads, setDownloads] = useState<Download[]>(LocalStorageService.getDownloads());
  const [localFiles, setLocalFiles] = useState<LocalFile[]>(LocalStorageService.getLocalFiles());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');

  // Ad Interstitial State
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [adCountdown, setAdCountdown] = useState(3);

  // Quality Selection State
  const [movieToDownload, setMovieToDownload] = useState<Movie | null>(null);
  const [selectedQuality, setSelectedQuality] = useState('1080p');

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || movie.category === selectedCategory;
      const matchesYear = selectedYear === 'All' || movie.year === selectedYear;
      return matchesSearch && matchesCategory && matchesYear;
    });
  }, [movies, searchQuery, selectedCategory, selectedYear]);

  const trendingMovies = useMemo(() => movies.filter(m => m.isTrending), [movies]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      const user = AuthService.login(authEmail);
      if (user) {
        setCurrentUser(user);
        setAuthEmail('');
      } else {
        alert('Access Denied. Account not found.');
      }
    } else {
      if (!authName || !authEmail) {
        alert('Please fill in all fields.');
        return;
      }
      const { user, error } = AuthService.register(authName, authEmail);
      if (user) {
        setCurrentUser(user);
        setAuthName('');
        setAuthEmail('');
        alert(`Welcome to the grid, ${user.name}!`);
      } else {
        alert(error || 'Registration failed.');
      }
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleAddMovie = (newMovie: Movie) => {
    setMovies(prev => [...prev, newMovie]);
  };

  const handleUpdateMovie = (updatedMovie: Movie) => {
    setMovies(prev => prev.map(m => m.id === updatedMovie.id ? updatedMovie : m));
  };

  const handleDeleteMovie = (id: string) => {
    if (confirm('Permanently remove this content from the grid?')) {
      setMovies(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleRemoveLocalFile = (id: string) => {
    if (confirm('Delete this file from your local storage?')) {
      LocalStorageService.removeLocalFile(id);
      setLocalFiles(LocalStorageService.getLocalFiles());
    }
  };

  const triggerDownloadProcess = (movie: Movie, quality: string) => {
    const sizeMap: Record<string, string> = {
        '4K': '8.2 GB',
        '1080p': '2.4 GB',
        '720p': '1.1 GB',
        '360p': '450 MB'
    };

    const newDownload: Download = {
      id: Date.now().toString(),
      movieId: movie.id,
      title: `${movie.title} (${quality})`,
      thumbnail: movie.thumbnail,
      progress: 0,
      status: 'downloading',
      size: sizeMap[quality] || '2.4 GB'
    };

    setDownloads(prev => [...prev, newDownload]);
    LocalStorageService.saveDownload(newDownload);
    
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 8;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setDownloads(prev => prev.map(d => d.movieId === movie.id ? { ...d, progress: 100, status: 'completed' } : d));
        LocalStorageService.addLocalFile({
          id: Date.now().toString(),
          name: `${movie.title} (${quality}).mp4`,
          url: movie.videoUrl,
          size: 2400000000,
          type: 'video/mp4'
        });
        setLocalFiles(LocalStorageService.getLocalFiles());
      } else {
        setDownloads(prev => prev.map(d => d.movieId === movie.id ? { ...d, progress: prog } : d));
      }
    }, 800);
  };

  const confirmDownload = () => {
    if (!movieToDownload) return;
    
    if (downloads.some(d => d.movieId === movieToDownload.id)) {
      alert('Already in downloads queue');
      setMovieToDownload(null);
      return;
    }

    // Show Interstitial Ad before initiating
    setAdCountdown(3);
    setShowAdOverlay(true);
    
    const movieRef = movieToDownload;
    const qualityRef = selectedQuality;
    setMovieToDownload(null);

    const timer = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowAdOverlay(false);
          triggerDownloadProcess(movieRef, qualityRef);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const renderHome = () => (
    <div className="pb-24">
      {/* Featured Hero Responsive */}
      <div className="relative w-full aspect-[21/9] md:aspect-[3/1] lg:aspect-[4/1] overflow-hidden">
        <img src={movies[0]?.thumbnail || 'https://picsum.photos/seed/placeholder/1200/600'} className="w-full h-full object-cover" alt="Hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        {movies[0] && (
          <div className="absolute bottom-8 md:bottom-12 left-6 md:left-16 right-6 space-y-3 md:space-y-6">
            <div className="flex items-center gap-2">
               <span className="bg-gold text-black text-[10px] md:text-xs font-black px-3 py-1 rounded">PLATINUM EXCLUSIVE</span>
               <span className="text-white/80 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">{movies[0].category}</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-luxury font-bold drop-shadow-2xl text-white tracking-tight">{movies[0].title}</h1>
            <p className="text-xs md:text-lg text-gray-300 line-clamp-2 max-w-xl font-light">{movies[0].description}</p>
            <div className="flex gap-4 pt-4 max-w-sm md:max-w-lg">
              <button 
                onClick={() => setPlayingMovie(movies[0])}
                className="flex-1 bg-white text-black py-3 md:py-4 rounded-xl font-black flex items-center justify-center gap-3 active:scale-95 hover:bg-gold transition-all uppercase text-xs md:text-sm tracking-widest shadow-xl"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current" /> Watch Now
              </button>
              <button 
                onClick={() => setMovieToDownload(movies[0])}
                className="px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-xl rounded-xl text-white font-bold border border-white/20 active:scale-95 hover:bg-white/20 transition-all shadow-xl"
              >
                <DownloadIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Trending Section */}
        <div className="mt-12 px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-3xl font-luxury font-bold text-gold flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gold rounded-full" /> Trending Worldwide
            </h2>
            <button className="text-[10px] md:text-xs uppercase text-gray-500 font-black tracking-[0.3em] flex items-center gap-2 hover:text-gold transition-colors">
              Explore Collection <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x">
            {trendingMovies.map(movie => (
              <div 
                key={movie.id} 
                className="min-w-[160px] md:min-w-[220px] lg:min-w-[280px] snap-start group cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 border border-white/5 transition-all group-hover:scale-[1.02] shadow-2xl">
                  <img onClick={() => setPlayingMovie(movie)} src={movie.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={movie.title} />
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span className="text-[10px] md:text-xs font-black text-white">{movie.rating}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMovieToDownload(movie); }}
                    className="absolute bottom-4 right-4 p-3 bg-gold text-black rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0"
                  >
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-sm md:text-lg font-bold text-gray-100 truncate group-hover:text-gold transition-colors">{movie.title}</h3>
                <p className="text-[10px] md:text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">{movie.year} • {movie.genres[0]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Real AdSense Unit 1 */}
        <AdBlock format="fluid" layout="in-article" />

        {/* 4K Grid Responsive */}
        <div className="mt-8 px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-3xl font-luxury font-bold text-gold flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gold rounded-full" /> 4K Ultra Cinematic
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
            {movies.map(movie => (
              <div 
                key={movie.id} 
                className="bg-charcoal/40 backdrop-blur-sm border border-white/5 rounded-[2.5rem] overflow-hidden group active:scale-95 hover:border-gold/30 transition-all cursor-pointer shadow-xl"
              >
                <div className="relative aspect-video">
                  <img onClick={() => setPlayingMovie(movie)} src={movie.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={movie.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 left-6">
                     <span className="bg-gold text-black text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-widest">Master 4K</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMovieToDownload(movie); }}
                    className="absolute top-4 right-6 p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-white hover:bg-gold hover:text-black transition-all"
                  >
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6" onClick={() => setPlayingMovie(movie)}>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-md md:text-lg font-black text-white truncate leading-tight">{movie.title}</h3>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-gold">
                       <Star className="w-3 h-3 fill-gold" />
                       <span className="text-[10px] font-bold">{movie.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                     <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">{movie.category}</span>
                     <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">{movie.genres[0]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="max-w-7xl mx-auto px-6 pt-12 pb-24">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-luxury font-bold gold-text-gradient mb-2">Master Library</h1>
          <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-[0.3em]">Explore Cinema By Genre & Era</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-4 rounded-2xl border transition-all flex items-center gap-3 font-bold uppercase text-xs tracking-widest ${showFilters ? 'bg-gold border-gold text-black shadow-gold/20' : 'border-white/10 text-white bg-white/5 hover:bg-white/10'}`}>
          <Filter className="w-5 h-5" /> {showFilters ? 'Hide Filters' : 'Refine Grid'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-charcoal border border-white/10 rounded-3xl p-8 mb-12 space-y-8 animate-in slide-in-from-top-6 duration-500 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-[10px] uppercase text-gold font-black mb-4 tracking-[0.4em]">Content Modality</p>
              <div className="flex flex-wrap gap-3">
                {['All', 'Movie', 'Series', 'Anime'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat as any)}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-gold text-black shadow-xl shadow-gold/10 scale-105' : 'bg-black/40 text-gray-500 border border-white/5 hover:border-white/20'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gold font-black mb-4 tracking-[0.4em]">Release Era</p>
              <div className="flex flex-wrap gap-3">
                {['All', ...YEARS].map(year => (
                  <button 
                    key={year}
                    onClick={() => setSelectedYear(year as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedYear === year ? 'bg-gold text-black shadow-xl shadow-gold/10 scale-105' : 'bg-black/40 text-gray-500 border border-white/5 hover:border-white/20'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {filteredMovies.map(movie => (
          <div 
            key={movie.id} 
            className="group active:scale-95 transition-all cursor-pointer"
          >
            <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden mb-4 shadow-2xl border border-white/5 group-hover:border-gold/30 transition-all">
              <img onClick={() => setPlayingMovie(movie)} src={movie.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={movie.title} />
              <div className="absolute top-4 left-4">
                 <span className="bg-black/60 backdrop-blur-xl text-gold text-[10px] font-black px-3 py-1.5 rounded-xl border border-gold/20 shadow-xl uppercase tracking-widest">{movie.year}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setMovieToDownload(movie); }}
                className="absolute bottom-4 right-4 p-3 bg-gold text-black rounded-2xl border border-gold/30 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
            </div>
            <div onClick={() => setPlayingMovie(movie)}>
                <h3 className="text-md font-black truncate text-gray-200 group-hover:text-gold transition-colors">{movie.title}</h3>
                <p className="text-[10px] text-gold/60 uppercase tracking-[0.2em] font-black mt-1">{movie.category}</p>
            </div>
          </div>
        ))}
      </div>
      {filteredMovies.length === 0 && (
        <div className="text-center py-32 flex flex-col items-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Search className="w-10 h-10 text-gray-700" />
          </div>
          <p className="text-gray-500 font-luxury text-xl">The grid remains empty for this query.</p>
        </div>
      )}
    </div>
  );

  const renderDownloads = () => (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-24 h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-3xl md:text-5xl font-luxury font-bold gold-text-gradient mb-8">Asset Manager</h1>
      
      {/* Live Ad Slot on Download Page */}
      <AdBlock format="auto" className="mb-8" />

      <div className="flex bg-charcoal rounded-2xl p-1.5 mb-10 border border-white/5">
         <button 
            onClick={() => setAssetTab('queue')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${assetTab === 'queue' ? 'text-black bg-gold shadow-inner shadow-black/20' : 'text-gray-500 hover:text-white'}`}
          >
            Active Queue
          </button>
         <button 
            onClick={() => setAssetTab('library')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${assetTab === 'library' ? 'text-black bg-gold shadow-inner shadow-black/20' : 'text-gray-500 hover:text-white'}`}
          >
            Offline Library
          </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-12 no-scrollbar pb-10">
        {assetTab === 'queue' ? (
          <section className="animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg"><DownloadIcon className="w-5 h-5 text-gold" /></div>
              <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-gray-400">Network Streams</h2>
            </div>
            {downloads.length === 0 ? (
              <div className="bg-charcoal/30 border border-white/5 rounded-[2.5rem] p-16 text-center flex flex-col items-center shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <DownloadIcon className="w-8 h-8 text-gray-700" />
                </div>
                <p className="text-sm text-gray-600 font-bold tracking-widest uppercase">No streams cached for offline use</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {downloads.map(dl => (
                  <div key={dl.id} className="bg-charcoal/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 flex gap-6 hover:border-gold/20 transition-all shadow-2xl">
                    <div className="relative w-24 h-36 md:w-32 md:h-48 rounded-2xl overflow-hidden shadow-xl">
                      <img src={dl.thumbnail} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 py-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg md:text-xl font-black text-white leading-tight">{dl.title}</h3>
                          <button onClick={() => {
                              setDownloads(d => d.filter(x => x.id !== dl.id));
                              LocalStorageService.removeDownload(dl.id);
                          }} className="p-2 hover:bg-red-500/10 rounded-full text-gray-600 hover:text-red-500 transition-all">
                             <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-gray-400 font-black uppercase tracking-widest">{dl.size}</span>
                          <span className="text-[10px] bg-gold/10 px-2 py-0.5 rounded border border-gold/20 text-gold font-black uppercase tracking-widest">{dl.status}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-2">
                          <span className="text-gold">{Math.floor(dl.progress)}% Optimized</span>
                          <span className="text-gray-600">Secure Protocol</span>
                        </div>
                        <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/10">
                          <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${dl.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/10 rounded-lg"><HardDrive className="w-5 h-5 text-gold" /></div>
              <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-gray-400">Vault Local Storage</h2>
            </div>
            <div className="grid gap-4">
              {localFiles.map(file => (
                <div key={file.id} className="bg-charcoal/20 hover:bg-charcoal/40 p-5 rounded-3xl flex items-center justify-between transition-all border border-white/5 group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gold/5 flex items-center justify-center border border-gold/10 group-hover:bg-gold group-hover:border-gold transition-all cursor-pointer">
                      <Play className="w-6 h-6 text-gold fill-gold group-hover:text-black group-hover:fill-black" />
                    </div>
                    <div>
                      <h4 className="text-sm md:text-md font-black text-white truncate max-w-[200px] md:max-w-md">{file.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{(file.size / 1000000000).toFixed(2)} GB • High Bitrate</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveLocalFile(file.id)}
                    className="p-3 text-gray-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {localFiles.length === 0 && (
                <div className="bg-charcoal/30 border border-white/5 rounded-[2.5rem] p-16 text-center flex flex-col items-center shadow-xl">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                    <HardDrive className="w-8 h-8 text-gray-700" />
                  </div>
                  <p className="text-sm text-gray-600 font-bold tracking-widest uppercase">No localized master files detected.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  const renderProfile = () => {
    if (!currentUser) {
      return (
        <div className="max-w-md mx-auto px-6 pt-24 pb-24">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gold/5 border border-gold/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
              {authMode === 'login' ? <UserIcon className="w-10 h-10 text-gold" /> : <UserPlus className="w-10 h-10 text-gold" />}
            </div>
            <h2 className="text-3xl font-luxury font-bold mb-4 tracking-tight">
              {authMode === 'login' ? 'Identity Required' : 'Create Master Account'}
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto font-light leading-relaxed uppercase tracking-widest">
              {authMode === 'login' ? 'Authenticate to access high-bitrate masters.' : 'Join the elite network for 4K cinematic streams.'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            {authMode === 'signup' && (
              <div className="relative animate-in slide-in-from-top-4 duration-300">
                <label className="text-[9px] uppercase text-gold font-black tracking-[0.4em] absolute -top-2 left-4 bg-black px-2 z-10">Legal Name</label>
                <input 
                  required
                  placeholder="Full Name..." 
                  className="w-full bg-charcoal border border-white/10 rounded-2xl px-6 py-5 focus:border-gold outline-none transition-all text-white font-bold tracking-widest shadow-xl"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                />
              </div>
            )}
            
            <div className="relative">
              <label className="text-[9px] uppercase text-gold font-black tracking-[0.4em] absolute -top-2 left-4 bg-black px-2 z-10">Access Identifier</label>
              <input 
                required
                type="email"
                placeholder="Secure Email..." 
                className="w-full bg-charcoal border border-white/10 rounded-2xl px-6 py-5 focus:border-gold outline-none transition-all text-white font-bold tracking-widest shadow-xl"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>
            
            <button 
              type="submit"
              className="w-full gold-gradient py-5 rounded-2xl font-black text-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {authMode === 'login' ? 'Sign In' : 'Register Account'}
            </button>
          </form>

          <div className="mt-12 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-xs text-gray-500 font-bold uppercase tracking-[0.3em] hover:text-gold transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an identifier? Sign In"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
          <div className="w-32 h-32 rounded-[2.5rem] border-4 border-gold shadow-2xl overflow-hidden p-1 bg-black">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-full h-full rounded-[2.1rem]" alt="Avatar" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-luxury font-bold text-white tracking-tighter mb-2">{currentUser.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <span className="bg-gold text-black text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-widest shadow-lg">{currentUser.role.replace('_', ' ')}</span>
              <span className="bg-white/5 text-[9px] px-3 py-1 rounded-lg border border-white/10 text-gray-400 font-black uppercase tracking-widest">Active Subscription</span>
              <span className="bg-white/5 text-[9px] px-3 py-1 rounded-lg border border-white/10 text-gray-400 font-black uppercase tracking-widest">PRO V1.4</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-charcoal/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-[10px] uppercase font-black tracking-[0.4em] text-gold mb-8">Core Preferences</h3>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="p-3 bg-black rounded-2xl border border-white/10"><Settings className="w-5 h-5 text-gray-500" /></div>
                   <span className="text-sm font-black uppercase tracking-widest">Master Dark Mode</span>
                </div>
                <div className={`w-14 h-7 rounded-full p-1.5 transition-all cursor-pointer ${isDarkMode ? 'bg-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-white/10'}`} onClick={() => setIsDarkMode(!isDarkMode)}>
                  <div className={`w-4 h-4 bg-black rounded-full transition-all duration-500 ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="p-3 bg-black rounded-2xl border border-white/10"><HardDrive className="w-5 h-5 text-gray-500" /></div>
                   <span className="text-sm font-black uppercase tracking-widest">Bitrate Optimizer</span>
                </div>
                <div className="w-14 h-7 rounded-full bg-white/10 p-1.5">
                  <div className="w-4 h-4 bg-black rounded-full translate-x-0" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {(currentUser.role === 'ADMIN' || currentUser.role === 'MAIN_ADMIN') && (
              <button 
                onClick={() => setActiveTab('admin')}
                className="w-full flex items-center justify-between bg-gold text-black p-8 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] active:scale-[0.98] transition-all shadow-2xl shadow-gold/20 group"
              >
                <div className="flex items-center gap-4">
                  <Shield className="w-6 h-6" /> Grid Controller
                </div>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-4 text-red-500 font-black uppercase tracking-[0.3em] text-xs p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/10 hover:bg-red-500/10 active:scale-[0.98] transition-all"
            >
              <LogOut className="w-5 h-5" /> Sever Connection
            </button>
          </div>
        </div>
        
        {/* Real AdSense Unit in Vault */}
        <AdBlock format="auto" />
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-onyx' : 'bg-gray-100'} text-white font-sans relative shadow-2xl overflow-x-hidden`}>
      {/* Header Responsive */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl px-6 md:px-12 py-5 border-b border-gold/10 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center transform rotate-45 shadow-2xl shadow-gold/30">
             <Play className="w-5 h-5 text-black fill-current -rotate-45 ml-0.5" />
           </div>
           <span className="font-luxury font-bold text-xl md:text-2xl gold-text-gradient tracking-tighter">TR3NDING BLOCK</span>
        </div>
        
        {/* Desktop Search Bar */}
        {(activeTab === 'home' || activeTab === 'categories') && (
          <div className="hidden md:block relative w-1/3">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             <input 
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-3 text-sm focus:outline-none focus:border-gold/50 transition-all font-bold tracking-widest"
              placeholder="Search Library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('profile')}
            className="w-12 h-12 rounded-2xl border border-gold/30 bg-gold/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl p-1"
          >
            {currentUser ? (
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-full h-full rounded-xl" alt="" />
            ) : (
               <UserIcon className="w-6 h-6 text-gold" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Responsive Padding */}
      <main className="pt-24 md:pt-28 animate-in fade-in duration-700 min-h-screen">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'categories' && renderCategories()}
        {activeTab === 'downloads' && renderDownloads()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'admin' && currentUser && (
          <div className="max-w-7xl mx-auto">
            <AdminPanel 
              currentUser={currentUser}
              movies={movies} 
              onAddMovie={handleAddMovie}
              onUpdateMovie={handleUpdateMovie}
              onDeleteMovie={handleDeleteMovie}
            />
          </div>
        )}
      </main>

      {/* Mobile Search Overlay */}
      <div className="md:hidden fixed top-[88px] left-0 right-0 z-40 px-6">
        {(activeTab === 'home' || activeTab === 'categories') && (
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              className="w-full bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-xs focus:outline-none focus:border-gold/50 transition-all shadow-2xl font-bold tracking-widest"
              placeholder="Query Master Grid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Responsive Navigation */}
      <nav className="fixed bottom-0 md:bottom-8 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl md:mx-auto z-[60] bg-charcoal/90 md:bg-charcoal/80 backdrop-blur-2xl border-t md:border border-gold/20 flex items-center justify-between px-8 py-5 md:py-4 md:rounded-3xl shadow-[0_-10px_60px_rgba(0,0,0,0.8)] md:shadow-2xl">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'home' ? 'text-gold scale-110' : 'text-gray-500'}`}>
          <Home className="w-7 h-7 md:w-6 md:h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setActiveTab('categories')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'categories' ? 'text-gold scale-110' : 'text-gray-500'}`}>
          <LayoutGrid className="w-7 h-7 md:w-6 md:h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Grids</span>
        </button>
        <button onClick={() => { setActiveTab('downloads'); setAssetTab('queue'); }} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'downloads' ? 'text-gold scale-110' : 'text-gray-500'}`}>
          <DownloadIcon className="w-7 h-7 md:w-6 md:h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Assets</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'profile' ? 'text-gold scale-110' : 'text-gray-500'}`}>
          <UserIcon className="w-7 h-7 md:w-6 md:h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Vault</span>
        </button>
      </nav>

      {/* 3-Second Interstitial Ad Overlay */}
      {showAdOverlay && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-gold/5 animate-pulse pointer-events-none" />
           <div className="max-w-lg w-full">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center shadow-2xl">
                  <Timer className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-xl font-luxury font-bold text-gold">Optimizing Connection...</h2>
              </div>
              
              <div className="bg-charcoal/50 border border-white/10 rounded-[2.5rem] p-8 mb-10 shadow-2xl backdrop-blur-xl">
                 <p className="text-xs text-gray-500 uppercase font-black tracking-[0.4em] mb-6">Sponsor Message</p>
                 <AdBlock format="rectangle" className="!px-0 !my-0" />
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Securing High-Bitrate Master Channel</p>
                 <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${adCountdown >= i ? 'bg-gold shadow-[0_0_10px_rgba(212,175,55,1)] scale-125' : 'bg-white/10'}`} />
                    ))}
                 </div>
                 <h3 className="text-4xl font-black text-white">{adCountdown}s</h3>
              </div>
           </div>
        </div>
      )}

      {/* Quality Selection Modal */}
      {movieToDownload && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center px-6">
          <div className="w-full max-w-lg bg-charcoal border border-gold/30 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
                <h3 className="font-luxury font-bold text-2xl text-gold tracking-tight">Stream Bitrate</h3>
                <button onClick={() => setMovieToDownload(null)} className="p-3 hover:bg-white/5 rounded-full transition-colors text-gray-500">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="flex items-center gap-6 mb-10 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                <img src={movieToDownload.thumbnail} className="w-20 h-28 object-cover rounded-2xl shadow-xl" alt="" />
                <div>
                    <h4 className="font-black text-white text-lg truncate max-w-[200px] leading-tight">{movieToDownload.title}</h4>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-2">{movieToDownload.category} • {movieToDownload.year}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-10">
                {QUALITIES.map(q => (
                    <button 
                        key={q}
                        onClick={() => setSelectedQuality(q)}
                        className={`flex items-center justify-between p-6 rounded-[1.8rem] border transition-all ${selectedQuality === q ? 'bg-gold/10 border-gold shadow-lg' : 'bg-black/40 border-white/5 hover:border-white/10'}`}
                    >
                        <div className="flex flex-col items-start">
                            <span className={`text-md font-black uppercase tracking-widest ${selectedQuality === q ? 'text-gold' : 'text-gray-400'}`}>{q}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                {q === '4K' ? '8.2 GB Master' : q === '1080p' ? '2.4 GB HD' : q === '720p' ? '1.1 GB Balanced' : '450 MB Efficiency'}
                            </span>
                        </div>
                        {selectedQuality === q ? (
                            <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/20">
                                <Check className="w-4 h-4 text-black stroke-[4px]" />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full border border-white/10" />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex gap-4">
                <button onClick={() => setMovieToDownload(null)} className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 border border-white/5 transition-all">Cancel</button>
                <button onClick={confirmDownload} className="flex-[2] gold-gradient py-5 rounded-2xl font-black text-black text-xs uppercase tracking-widest shadow-2xl shadow-gold/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                    <DownloadIcon className="w-5 h-5" /> Initiate Sync
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Overlay */}
      {playingMovie && (
        <MediaPlayer 
          url={playingMovie.videoUrl} 
          title={playingMovie.title}
          onClose={() => setPlayingMovie(null)} 
        />
      )}
    </div>
  );
};

export default App;
