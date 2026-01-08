import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';

// Import Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const BlogSection = () => {
  // Dữ liệu mẫu 5 bài viết
  const blogPosts = [
    {
      id: 1,
      title: "Bí mật đằng sau thăn bò Wagyu A5 thượng hạng",
      excerpt: "Khám phá quy trình nuôi dưỡng và chế biến loại thịt bò đắt đỏ nhất thế giới tại nhà hàng chúng tôi.",
      date: "05/01/2026",
      author: "Chef Ramsay",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
      category: "Kiến thức"
    },
    {
      id: 2,
      title: "Nghệ thuật thưởng thức rượu vang và Steak",
      excerpt: "Hướng dẫn cách kết hợp rượu vang đỏ với các loại thịt nướng để tăng hương vị hoàn hảo.",
      date: "02/01/2026",
      author: "Sommelier Tuan",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
      category: "Mẹo hay"
    },
    {
      id: 3,
      title: "Tiệc tối lãng mạn: Nên chọn món gì?",
      excerpt: "Gợi ý thực đơn 5 món dành cho các cặp đôi trong ngày kỷ niệm hoặc Valentine.",
      date: "28/12/2025",
      author: "Admin",
      image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80",
      category: "Sự kiện"
    },
    {
      id: 4,
      title: "Tại sao chúng tôi chọn rau Organic Đà Lạt?",
      excerpt: "Hành trình từ nông trại đến bàn ăn, cam kết sức khỏe cho mọi thực khách.",
      date: "20/12/2025",
      author: "Chef Linh",
      image: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80",
      category: "Nguyên liệu"
    },
    {
      id: 5,
      title: "Phong cách Omokase là gì?",
      excerpt: "Trải nghiệm tin tưởng tuyệt đối vào đầu bếp để nhận lại những món ăn bất ngờ nhất.",
      date: "15/12/2025",
      author: "Chef Akira",
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80",
      category: "Văn hóa"
    }
  ];

  return (
    <section className="py-20 px-4 bg-neutral-900">
      <div className="container mx-auto max-w-7xl">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">Our Stories</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Góc <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Ẩm Thực</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Những câu chuyện đằng sau mỗi món ăn và bí quyết ẩm thực từ các đầu bếp hàng đầu.
          </p>
        </div>

        {/* SWIPER CAROUSEL */}
        <div className="mb-12">
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2, // Tablet: 2 cột
              },
              1024: {
                slidesPerView: 3, // PC: 3 cột
              },
            }}
            className="pb-12 px-2" // Padding bottom cho dấu chấm pagination
          >
            {blogPosts.map((post) => (
              <SwiperSlide key={post.id} className="h-auto">
                <article className="group h-full flex flex-col bg-neutral-950 rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10">
                  
                  {/* ẢNH THUMBNAIL */}
                  <div className="relative h-60 overflow-hidden shrink-0">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Badge Category */}
                    <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {post.category}
                    </div>
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                  </div>

                  {/* NỘI DUNG */}
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-orange-500"/>
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-orange-500"/>
                        <span>{post.author}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-orange-500 transition-colors">
                      <Link to={`/blog/${post.id}`}>
                        {post.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
                      {post.excerpt}
                    </p>

                    {/* Button */}
                    <Link 
                      to={`/blog/${post.id}`}
                      className="inline-flex items-center gap-2 text-orange-500 font-bold text-sm uppercase tracking-wide group/link mt-auto"
                    >
                      Xem chi tiết
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* BUTTON XEM TẤT CẢ */}
        <div className="text-center">
          <Link 
            to="/blog"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/10 transition-all hover:scale-105"
          >
            Xem tất cả bài viết
            <ArrowRight size={20} />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default BlogSection;