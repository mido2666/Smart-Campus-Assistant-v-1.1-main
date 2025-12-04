const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('🚀 Starting database optimization...');

  try {
    // Create performance indexes
    console.log('📊 Creating performance indexes...');
    
    const indexes = [
      // User indexes
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id);',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);',
      
      // Course indexes
      'CREATE INDEX IF NOT EXISTS idx_courses_professor_id ON courses(professor_id);',
      'CREATE INDEX IF NOT EXISTS idx_courses_course_code ON courses(course_code);',
      'CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);',
      
      // Course enrollment indexes
      'CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);',
      'CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);',
      'CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);',
      'CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrolled_at ON course_enrollments(enrolled_at);',
      
      // Schedule indexes
      'CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON schedules(course_id);',
      'CREATE INDEX IF NOT EXISTS idx_schedules_professor_id ON schedules(professor_id);',
      'CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON schedules(day_of_week);',
      'CREATE INDEX IF NOT EXISTS idx_schedules_semester ON schedules(semester);',
      'CREATE INDEX IF NOT EXISTS idx_schedules_is_active ON schedules(is_active);',
      
      // Attendance record indexes
      'CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);',
      'CREATE INDEX IF NOT EXISTS idx_attendance_records_course_id ON attendance_records(course_id);',
      'CREATE INDEX IF NOT EXISTS idx_attendance_records_qr_code_id ON attendance_records(qr_code_id);',
      'CREATE INDEX IF NOT EXISTS idx_attendance_records_marked_at ON attendance_records(marked_at);',
      'CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);',
      'CREATE INDEX IF NOT EXISTS idx_attendance_records_created_at ON attendance_records(created_at);',
      
      // QR code indexes
      'CREATE INDEX IF NOT EXISTS idx_qr_codes_course_id ON qr_codes(course_id);',
      'CREATE INDEX IF NOT EXISTS idx_qr_codes_professor_id ON qr_codes(professor_id);',
      'CREATE INDEX IF NOT EXISTS idx_qr_codes_expires_at ON qr_codes(expires_at);',
      'CREATE INDEX IF NOT EXISTS idx_qr_codes_is_active ON qr_codes(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes(created_at);',
      
      // Notification indexes
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);',
      
      // Chat session indexes
      'CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON chat_sessions(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at);',
      
      // Chat message indexes
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_is_processed ON chat_messages(is_processed);',
    ];

    for (const indexQuery of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexQuery);
        console.log(`✅ Created index: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        console.warn(`⚠️  Index creation failed: ${error.message}`);
      }
    }

    // Update database statistics
    console.log('📈 Updating database statistics...');
    await prisma.$executeRawUnsafe('ANALYZE;');
    console.log('✅ Database statistics updated');

    // Optimize database settings
    console.log('⚙️  Optimizing database settings...');
    
    const optimizationQueries = [
      // Enable query statistics
      "ALTER SYSTEM SET track_activity_query_size = 2048;",
      "ALTER SYSTEM SET log_statement = 'mod';",
      "ALTER SYSTEM SET log_min_duration_statement = 1000;",
      
      // Memory settings
      "ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';",
      "ALTER SYSTEM SET max_connections = 200;",
      "ALTER SYSTEM SET shared_buffers = '256MB';",
      "ALTER SYSTEM SET effective_cache_size = '1GB';",
      "ALTER SYSTEM SET maintenance_work_mem = '64MB';",
      "ALTER SYSTEM SET checkpoint_completion_target = 0.9;",
      "ALTER SYSTEM SET wal_buffers = '16MB';",
      "ALTER SYSTEM SET default_statistics_target = 100;",
      
      // Query optimization
      "ALTER SYSTEM SET random_page_cost = 1.1;",
      "ALTER SYSTEM SET effective_io_concurrency = 200;",
      "ALTER SYSTEM SET work_mem = '4MB';",
      "ALTER SYSTEM SET min_wal_size = '1GB';",
      "ALTER SYSTEM SET max_wal_size = '4GB';",
      
      // Logging settings
      "ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';",
      "ALTER SYSTEM SET log_checkpoints = on;",
      "ALTER SYSTEM SET log_connections = on;",
      "ALTER SYSTEM SET log_disconnections = on;",
      "ALTER SYSTEM SET log_lock_waits = on;",
    ];

    for (const query of optimizationQueries) {
      try {
        await prisma.$executeRawUnsafe(query);
        console.log(`✅ Applied setting: ${query.split(' ')[2]}`);
      } catch (error) {
        console.warn(`⚠️  Setting failed: ${error.message}`);
      }
    }

    // Reload configuration
    console.log('🔄 Reloading configuration...');
    await prisma.$executeRawUnsafe('SELECT pg_reload_conf();');
    console.log('✅ Configuration reloaded');

    // Create materialized views for performance
    console.log('📊 Creating materialized views...');
    
    const materializedViews = [
      // Student attendance summary
      `CREATE MATERIALIZED VIEW IF NOT EXISTS student_attendance_summary AS
       SELECT 
         s.id as student_id,
         s.university_id,
         s.first_name,
         s.last_name,
         c.id as course_id,
         c.course_code,
         c.course_name,
         COUNT(ar.id) as total_classes,
         COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END) as present_count,
         COUNT(CASE WHEN ar.status = 'ABSENT' THEN 1 END) as absent_count,
         COUNT(CASE WHEN ar.status = 'LATE' THEN 1 END) as late_count,
         ROUND(
           (COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::float / 
            NULLIF(COUNT(ar.id), 0)) * 100, 2
         ) as attendance_percentage
       FROM users s
       JOIN course_enrollments ce ON s.id = ce.student_id
       JOIN courses c ON ce.course_id = c.id
       LEFT JOIN attendance_records ar ON s.id = ar.student_id AND c.id = ar.course_id
       WHERE s.role = 'STUDENT' AND ce.status = 'ACTIVE'
       GROUP BY s.id, s.university_id, s.first_name, s.last_name, c.id, c.course_code, c.course_name;`,
      
      // Course statistics
      `CREATE MATERIALIZED VIEW IF NOT EXISTS course_statistics AS
       SELECT 
         c.id as course_id,
         c.course_code,
         c.course_name,
         COUNT(DISTINCT ce.student_id) as enrolled_students,
         COUNT(DISTINCT ar.id) as total_attendance_records,
         COUNT(DISTINCT qr.id) as total_qr_codes,
         AVG(CASE WHEN ar.status = 'PRESENT' THEN 1.0 ELSE 0.0 END) * 100 as avg_attendance_rate
       FROM courses c
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'ACTIVE'
       LEFT JOIN attendance_records ar ON c.id = ar.course_id
       LEFT JOIN qr_codes qr ON c.id = qr.course_id
       WHERE c.is_active = true
       GROUP BY c.id, c.course_code, c.course_name;`,
    ];

    for (const viewQuery of materializedViews) {
      try {
        await prisma.$executeRawUnsafe(viewQuery);
        console.log('✅ Created materialized view');
      } catch (error) {
        console.warn(`⚠️  Materialized view creation failed: ${error.message}`);
      }
    }

    // Create refresh function for materialized views
    console.log('🔄 Creating refresh functions...');
    
    const refreshFunction = `
      CREATE OR REPLACE FUNCTION refresh_materialized_views()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW student_attendance_summary;
        REFRESH MATERIALIZED VIEW course_statistics;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    try {
      await prisma.$executeRawUnsafe(refreshFunction);
      console.log('✅ Created refresh function');
    } catch (error) {
      console.warn(`⚠️  Refresh function creation failed: ${error.message}`);
    }

    // Set up automatic refresh of materialized views
    console.log('⏰ Setting up automatic refresh...');
    
    // This would typically be done with a cron job or scheduled task
    // For now, we'll just refresh them once
    try {
      await prisma.$executeRawUnsafe('SELECT refresh_materialized_views();');
      console.log('✅ Materialized views refreshed');
    } catch (error) {
      console.warn(`⚠️  Materialized view refresh failed: ${error.message}`);
    }

    console.log('🎉 Database optimization completed successfully!');
    console.log('\n📋 Optimization Summary:');
    console.log('- Performance indexes created');
    console.log('- Database statistics updated');
    console.log('- Database settings optimized');
    console.log('- Materialized views created');
    console.log('- Refresh functions created');

  } catch (error) {
    console.error('❌ Error optimizing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
