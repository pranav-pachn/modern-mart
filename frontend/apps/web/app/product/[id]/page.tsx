"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, Minus, Plus, ShoppingBag, XCircle, Star, MessageSquare } from "lucide-react";
import { useCart } from "@/store/cart";
import { ProductDetailsSkeleton } from "@/components/Skeletons";
import toast from "react-hot-toast";

type ProductDetails = {
  _id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  stock?: number;
  description?: string;
  unit?: string;
};

type Review = {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewsData = {
  reviews: Review[];
  avgRating: number;
  totalReviews: number;
};

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Review form state
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);

  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();

  const fetchProductAndReviews = async () => {
    try {
      const [prodRes, reviewsRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch(`/api/products/${id}/reviews`)
      ]);
      
      if (!prodRes.ok) throw new Error("Failed to load product");
      
      const prodData = await prodRes.json();
      setProduct(prodData);

      if (reviewsRes.ok) {
        const revData = await reviewsRes.json();
        setReviewsData(revData);
      }
    } catch (e: any) {
      setError(e.message || "Could not load the product details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProductAndReviews();
  }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return toast.error("Please write a comment.");
    
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      
      toast.success("Review added successfully!");
      setReviewComment("");
      setReviewRating(5);
      fetchProductAndReviews(); // refresh reviews list
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const cartItem = product ? cart.find((c) => c.id === product._id) : undefined;
  
  const imageSrc = product?.image && /^(https?:\/\/|data:|blob:|\/)/.test(product.image)
    ? product.image
    : "/products/placeholder.svg";

  if (isLoading) {
    return (
      <main className="lp-root bg-white min-h-screen pb-24">
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="lp-section-inner py-4">
            <div className="h-4 w-48 rounded-md bg-gray-100 animate-pulse" />
          </div>
        </div>
        <ProductDetailsSkeleton />
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="lp-root bg-white min-h-screen py-20 px-6">
        <div className="lp-section-inner flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-500 mb-8">{error || "The product you're looking for doesn't exist."}</p>
          <Link href="/shop" className="lp-cta-btn">Back to Shop</Link>
        </div>
      </main>
    );
  }

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const quantityInCart = cartItem?.quantity || 0;
  const maxReached = product.stock !== undefined && quantityInCart >= product.stock;

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    const cartProduct = {
      id: product._id,
      name: product.name,
      category: product.category,
      unit: product.unit ?? "1 item",
      price: product.price,
      rating: reviewsData?.avgRating || 0,
      image: product.image,
      stock: product.stock,
    };
    addToCart(cartProduct);
    toast.success("Added to cart");
  };

  return (
    <main className="lp-root bg-white min-h-screen pb-24">
      {/* Breadcrumb nav */}
      <div className="bg-zinc-50 border-b border-zinc-100 hidden sm:block">
        <div className="lp-section-inner py-4">
          <nav className="flex items-center text-sm text-zinc-500 space-x-2">
            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4 text-zinc-300" />
            <Link href="/shop" className="hover:text-zinc-900 transition-colors">Shop</Link>
            <ChevronRight className="h-4 w-4 text-zinc-300" />
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-zinc-900 transition-colors capitalize">
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4 text-zinc-300" />
            <span className="text-zinc-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="lp-section-inner py-6 sm:py-12 flex flex-col md:flex-row gap-8 lg:gap-16">
        
        {/* Left: Image Gallery */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="block sm:hidden mb-2">
             <Link href="/shop" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700">
               <ArrowLeft className="h-4 w-4 mr-1" />
               Back to Shop
             </Link>
          </div>
          <div className="bg-zinc-50 rounded-3xl border border-zinc-100 aspect-square relative overflow-hidden flex items-center justify-center p-8 group">
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="w-full md:w-1/2 flex flex-col">
          {/* Tag & Title */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
              {product.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
              {product.name}
            </h1>
            
            {/* Reviews Summary */}
            {reviewsData && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(reviewsData.avgRating) ? "fill-current" : "text-gray-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">{reviewsData.avgRating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({reviewsData.totalReviews} reviews)</span>
              </div>
            )}
            <p className="text-gray-500 text-lg">{product.unit ?? "1 item"}</p>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-4xl font-black text-gray-900 tracking-tight">₹{product.price}</span>
            {/* Status Badges */}
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600 mb-1">
                <XCircle className="h-4 w-4" /> Out of stock
              </span>
            ) : product.stock !== undefined && product.stock < 10 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600 mb-1">
                ⚠️ Only {product.stock} left in stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600 mb-1">
                <CheckCircle2 className="h-4 w-4" /> In stock
              </span>
            )}
          </div>

          <div className="h-px w-full bg-gray-200 mb-8" />
          
          <h3 className="font-bold text-gray-900 text-lg mb-2">Description</h3>
          <p className="text-gray-600 leading-relaxed mb-8">
            {product.description || `Fresh, high-quality ${product.name.toLowerCase()} sourced locally. Perfect for your daily needs and selected with care by Panchavati Mart to ensure the best standard for your family.`}
          </p>

          {/* Actions */}
          <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-4">
            {isOutOfStock ? (
              <button disabled className="lp-cta-btn bg-gray-300 text-white cursor-not-allowed hover:translate-y-0 shadow-none border-transparent w-full sm:w-auto flex-1 justify-center">
                Out of Stock
              </button>
            ) : cartItem ? (
              <div className="flex items-center justify-between rounded-xl border-2 border-emerald-600 bg-white h-14 overflow-hidden w-full sm:w-48">
                <button
                  onClick={() => decreaseQuantity(product._id)}
                  className="flex h-full w-14 items-center justify-center transition hover:bg-emerald-50 text-emerald-700"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="flex flex-col items-center justify-center flex-1">
                   <span className="text-lg font-black text-gray-900">{cartItem.quantity}</span>
                   {maxReached && <span className="text-[10px] text-orange-600 font-bold leading-none -mt-1">MAX</span>}
                </div>
                <button
                  onClick={() => {
                    if (!maxReached) increaseQuantity(product._id);
                  }}
                  disabled={maxReached}
                  className={`flex h-full w-14 items-center justify-center transition ${maxReached ? "text-gray-300 bg-gray-50 cursor-not-allowed" : "hover:bg-emerald-50 text-emerald-700"}`}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="lp-cta-btn flex-1 justify-center flex items-center gap-2 h-14"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="lp-section-inner py-12 border-t border-zinc-100 mt-8">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Reviews List */}
          <div className="w-full lg:w-2/3">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
              Customer Reviews
            </h2>
            
            {!reviewsData || reviewsData.reviews.length === 0 ? (
              <div className="bg-zinc-50 rounded-2xl p-8 text-center border border-dashed border-zinc-200">
                <p className="text-zinc-500 mb-2">No reviews yet.</p>
                <p className="text-zinc-400 text-sm">Be the first to review this product!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviewsData.reviews.map((review) => (
                  <div key={review._id} className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-zinc-900">{review.userName}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-zinc-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write Review Form */}
          <div className="w-full lg:w-1/3">
            <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200 sticky top-24">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Write a Review</h3>
              
              {!session ? (
                <div className="text-center py-6">
                  <p className="text-zinc-500 mb-4 text-sm">You must be logged in to leave a review.</p>
                  <Link href={`/login?callbackUrl=/product/${id}`} className="lp-cta-btn w-full justify-center text-sm py-2">
                    Log In to Review
                  </Link>
                </div>
              ) : (
                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          className="focus:outline-none transition-transform hover:scale-110"
                          onMouseEnter={() => setReviewHover(star)}
                          onMouseLeave={() => setReviewHover(0)}
                          onClick={() => setReviewRating(star)}
                        >
                          <Star 
                            className={`h-8 w-8 ${
                              star <= (reviewHover || reviewRating) 
                                ? "fill-amber-400 text-amber-400" 
                                : "text-zinc-300"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Comment</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="What did you think of this product?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="lp-cta-btn w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>

    </main>
  );
}
