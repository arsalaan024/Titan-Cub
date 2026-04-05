import React from 'react';
import { motion } from 'framer-motion';

const AboutView: React.FC = () => {
  // To use a Google Drive photo, use the format: https://drive.google.com/uc?export=view&id=FILE_ID
  const hodImageUrl = "https://lh3.googleusercontent.com/d/1MNlrD_g9Umla9llqNhHm5g5fURkwMByD";

  return (
    <main className="pt-[9px] pb-32 px-6 max-w-7xl mx-auto font-body selection:bg-primary-container selection:text-on-primary-container bg-background">
      {/* Head / Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start relative">
        {/* Background Decorative Element */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-surface-container-low rounded-full blur-3xl opacity-50 -z-10"></div>
        
        {/* Left Column: Narrative */}
        <div className="lg:col-span-7 space-y-16">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h2 className="font-headline text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface leading-[0.9] lg:-ml-1">
              A Word from <br/>
              <span className="text-primary italic relative">
                the HOD
                <svg className="absolute -bottom-2 left-0 w-full h-2 text-primary-dim/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
            </h2>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-10 text-lg leading-relaxed text-on-surface-variant max-w-2xl relative"
          >
            <div className="absolute -left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-transparent opacity-30 rounded-full hidden md:block"></div>
            
            <p className="font-bold text-on-surface text-2xl leading-tight tracking-tight">
              "It gives me immense pleasure to witness the remarkable growth and continued success of the Titans Students Association..."
            </p>
            
            <div className="space-y-6 opacity-90">
              <p>
                The association stands as a vibrant platform where students not only exhibit their technical acumen but also cultivate essential life skills such as leadership, teamwork, and organizational competence. At the Department of Information Technology, we remain committed to nurturing talent beyond the boundaries of the classroom. We encourage our students to explore their creative and technical potential through diverse opportunities.
              </p>
              <p>
                Through a well-rounded blend of seminars, workshops, technical events, and community-driven initiatives, the Titan Students Association fosters a culture of innovation, collaboration, and holistic development. I am immensely proud of the dedication, enthusiasm, and collaborative spirit shown by our students and faculty coordinators in making every initiative a success.
              </p>
              <p>
                I am confident that the association will continue to thrive and inspire a legacy of excellence in the years to come. I extend my best wishes to the Titans Students Association for all its future endeavors.
              </p>
            </div>
            
            <div className="pt-4">
              <p className="font-headline text-2xl font-black text-on-surface tracking-tighter">Dr. Vilas Gaikwad</p>
              <p className="font-label text-xs uppercase tracking-[0.2em] text-primary font-bold mt-1">PhD.(CSE), M.Tech(CSE), BE(CSE)</p>
              <p className="text-sm opacity-60 font-medium">Head of Department - IT, Trinity College of Engineering and Research</p>
            </div>
          </motion.div>

          {/* Department Info Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-6 rounded-3xl bg-surface-container-low space-y-3 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-2xl font-bold">rocket_launch</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-headline text-xl font-bold text-on-surface">Our Mission</h4>
                <p className="text-sm leading-relaxed opacity-80 text-on-surface-variant">
                  To deliver secure, scalable, and forward-thinking technology solutions that drive efficiency and innovation.
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-6 rounded-3xl bg-surface-container-highest space-y-3 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-secondary shadow-sm group-hover:shadow-md transition-all">
                <span className="material-symbols-outlined text-2xl font-bold">visibility</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-headline text-xl font-bold text-on-surface">Our Vision</h4>
                <p className="text-sm leading-relaxed opacity-80 text-on-surface-variant">
                  To create a world-class digital ecosystem where technology is invisible yet indispensable, providing every student and faculty member with a secure, intuitive, and powerful platform to achieve their best work.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Visual Anchor */}
        <div className="lg:col-span-5 lg:sticky lg:top-32 mt-12 lg:mt-0">
          <div className="relative group">
            {/* Background Accent */}
            <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(78,33,30,0.25)] ring-1 ring-on-surface/5"
            >
              <img 
                alt="Dr. Vilas Gaikwad - HOD IT" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                src={hodImageUrl} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface via-on-surface/20 to-transparent opacity-60"></div>
              
              <div className="absolute bottom-10 left-10 right-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="space-y-1"
                >
                  <p className="font-label text-[10px] uppercase tracking-[0.3em] text-primary-fixed mb-2 font-bold">Department Head</p>
                  <h3 className="font-headline text-4xl font-bold text-white leading-none">Dr. Vilas Gaikwad</h3>
                  <p className="text-white/70 text-sm font-medium pt-2 border-t border-white/10 mt-4 italic">"Leading the next generation of IT innovators."</p>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Institution Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 p-8 rounded-[2rem] bg-white border border-on-surface/5 shadow-xl flex items-center justify-between group cursor-pointer hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-surface shadow-inner flex items-center justify-center p-3">
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Trinity_College_of_Engineering_and_Research_Logo.png/220px-Trinity_College_of_Engineering_and_Research_Logo.png" alt="TCOER Logo" className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" />
              </div>
              <div>
                <p className="font-label text-xs uppercase tracking-widest text-primary font-bold">Academic Institution</p>
                <p className="font-bold text-on-surface text-xl tracking-tight">Trinity College of Engg & Research</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default AboutView;
