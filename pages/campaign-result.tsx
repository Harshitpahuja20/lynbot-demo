import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  Users,
  Search,
  Filter,
  Eye,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

/** ---------- Types ---------- **/

interface SearchResult {
  id: string;
  campaign_id?: string | { id: string; name?: string };
  title?: string;
  description?: string;
  created_at?: string;
  url?: string;
  results?: Prospect[]; // assume backend returns "prospects" here
  [k: string]: any;
}

interface Prospect {
  id?: string;
  name?: string;
  title?: string;
  profileUrl?: string;
  photoUrl?: string;
  followers?: number;
  followerCount?: number;
  followersText?: string;
  mutualsText?: string;
  [k: string]: any; // allow extra fields
}

interface Campaign {
  id: string;
  name: string;
}

const ProspectsPage: React.FC = () => {
  /** ---------- State ---------- **/
  const [items, setItems] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCampaign, setFilterCampaign] = useState<"all" | string>("all");

  // UI
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  // Modal-specific (to match your snippet)
  const [showMessageModal] = useState(true); // snippet uses it in inline style; keep as always 'block'
  const [searchResults, setSearchResults] = useState<Prospect[]>([]);
  const [selectedResultUrls, setSelectedResultUrls] = useState<string[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [savingResults, setSavingResults] = useState(false);

  /** ---------- Debounce ---------- **/
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /** ---------- Fetches ---------- **/
  useEffect(() => {
    fetchItems(
      pagination.page,
      pagination.limit,
      debouncedSearch,
      filterCampaign
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearch, filterCampaign]);

  useEffect(() => {
    fetchCampaigns();
    const urlParams = new URLSearchParams(window.location.search);
    const campaignIdFromUrl = urlParams.get('id');
    if (campaignIdFromUrl) {
      setFilterCampaign(campaignIdFromUrl);
    }
  }, []);

  // Unified mapper
  const normalizeItem = (raw: any): SearchResult => {
    const campaign_id =
      raw.campaign_id ??
      raw.campaignId?.id ??
      raw.campaigns?.id ??
      raw.campaignId ??
      raw.campaigns;

    const created_at = raw.created_at ?? raw.createdAt;
    const title =
      raw.title ?? raw.linkedin_data?.name ?? raw.linkedinData?.name ?? "";
    const description =
      raw.description ??
      raw.linkedin_data?.headline ??
      raw.linkedinData?.headline ??
      raw.linkedin_data?.summary ??
      raw.linkedinData?.summary ??
      "";

    return {
      ...raw,
      id:
        raw.id ??
        raw._id ??
        (typeof crypto !== "undefined"
          ? crypto.randomUUID()
          : String(Math.random())),
      campaign_id,
      title,
      description,
      created_at,
      results: raw.results, // assume array of prospects
    } as SearchResult;
  };

  const fetchItems = async (
    page = 1,
    limit = 20,
    search = "",
    campaignId = "all"
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append("search", search);
      if (campaignId && campaignId !== "all") params.append("campaignId", campaignId);

      const response = await fetch(`/api/search-results?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/signin";
          return;
        }
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();
      const rawArray: any[] =
        data.searchResults ?? data.results ?? data.items ?? [];

      const normalized = rawArray.map(normalizeItem);
      setItems(normalized);

      if (data.pagination && typeof data.pagination === "object") {
        setPagination({
          page: Number(data.pagination.page) || page,
          limit: Number(data.pagination.limit) || limit,
          total: Number(data.pagination.total) || rawArray.length,
          pages:
            Number(data.pagination.pages) ||
            Math.max(
              1,
              Math.ceil(
                (Number(data.pagination.total) || rawArray.length) /
                  (Number(data.pagination.limit) || limit)
              )
            ),
        });
      } else {
        setPagination((p) => {
          const total = rawArray.length;
          const pages = Math.max(1, Math.ceil(total / p.limit));
          const safePage = Math.min(Math.max(1, p.page), pages);
          return { ...p, total, pages, page: safePage };
        });
      }
    } catch (err) {
      console.error("Error fetching results:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data?.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      } else if (Array.isArray(data)) {
        setCampaigns(data as Campaign[]);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  };

  /** ---------- Modal helpers to match your snippet ---------- **/
  const toggleSelectResult = (url?: string) => {
    if (!url) return;
    setSelectedResultUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleSaveProspects = async (urls?: string[]) => {
    try {
      setSavingResults(true);
      // Decide which prospects to save
      const toSave =
        urls && urls.length > 0
          ? searchResults.filter((p) => urls.includes(p.profileUrl || ""))
          : searchResults;

      // Replace with your real endpoint/payload
      await fetch("/api/prospects/save", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prospects: toSave }),
      });

      // Close and reset just like your snippet expects
      setShowResultsModal(false);
      setSearchResults([]);
      setSelectedResultUrls([]);
    } catch (e) {
      console.error("Saving prospects failed", e);
      // keep modal open but you could set an error UI here
    } finally {
      setSavingResults(false);
    }
  };

  const handleGenerateMessage = (prospect: Prospect) => {
    // Hook your actual message generation here
    console.log("Generate message for", prospect);
  };

  /** ---------- Helpers ---------- **/
  const getCampaignLabel = (campaign_id: SearchResult["campaign_id"]) => {
    if (!campaign_id) return "—";
    if (typeof campaign_id === "string") return campaign_id;
    if (typeof campaign_id === "object") {
      return campaign_id.name || campaign_id.id || "—";
    }
    return String(campaign_id);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  const openResultsModal = (item: SearchResult) => {
    setSelectedItem(item);
    // Seed modal data from the item's results (assumed to be prospects array)
    setSearchResults(Array.isArray(item.results) ? item.results : []);
    setSelectedResultUrls([]);
    setShowResultsModal(true);
  };

  /** ---------- Render ---------- **/
  return (
    <Layout>
      <div className="space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Results</h1>
            <p className="text-gray-600">
              Showing {pagination.total} {pagination.total === 1 ? "result" : "results"}
            </p>
          </div>


        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by keyword…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={filterCampaign}
              onChange={(e) => {
                setPagination((p) => ({ ...p, page: 1 }));
                setFilterCampaign(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow-sm relative">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Results (Page {pagination.page} of {pagination.pages}, Total: {pagination.total})
            </h3>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading…</span>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {item?.campaign_id?.name || "Untitled"}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {item?.campaign_id?.description || "No description"}
                        </p>

                        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                          {/* <span>
                            <strong>Campaign:</strong> {getCampaignLabel(item.campaign_id)}
                          </span> */}
                          <span>
                            <strong>Created:</strong> {formatDate(item.created_at)}
                          </span>
                          {Array.isArray(item.results) && (
                            <span>
                              <strong>Results:</strong> {item.results.length}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                            title="Open Link"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openResultsModal(item)}
                          className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                          title="View Results"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing page {pagination.page} of {pagination.pages} (Total: {pagination.total})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        page: Math.max(1, p.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        page: Math.min(p.pages, p.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results Modal — EXACT structure as your snippet, now fully wired */}
      {showResultsModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          style={{ display: showMessageModal ? "block" : "block" }}
        >
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Search Results ({searchResults.length} prospects found)
                </h3>
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {searchResults.map((prospect, index) => (
                    <div
                      key={prospect.id ?? index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 flex items-start gap-3">
                          {/* <label className="flex items-start mt-1">
                            <input
                              type="checkbox"
                              checked={selectedResultUrls.includes(
                                prospect?.profileUrl || ""
                              )}
                              onChange={() =>
                                toggleSelectResult(prospect?.profileUrl)
                              }
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 mt-1"
                            />
                          </label> */}

                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                              {prospect?.photoUrl ? (
                                <img
                                  src={prospect.photoUrl}
                                  alt={prospect.name || "Prospect"}
                                  className="h-12 w-12 object-cover"
                                />
                              ) : (
                                <Users className="h-8 w-8 text-gray-400 m-2" />
                              )}
                            </div>

                            <div>
                              <a
                                href={prospect?.profileUrl || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-gray-900 hover:underline"
                              >
                                {prospect?.name || "Unknown"}
                              </a>
                              <p className="text-sm text-gray-600 mt-1 max-w-xl">
                                {prospect?.title || ""}
                              </p>

                              {/* Followers and mutuals line (compact) */}
                              <p className="text-sm text-gray-500 mt-1">
                                {(() => {
                                  const followersRaw =
                                    prospect?.followers ||
                                    prospect?.followerCount ||
                                    prospect?.followersText;
                                  let followersText = "";
                                  try {
                                    if (followersRaw) {
                                      if (typeof followersRaw === "number") {
                                        followersText =
                                          new Intl.NumberFormat("en", {
                                            notation: "compact",
                                            maximumFractionDigits: 1,
                                          }).format(followersRaw) +
                                          " followers";
                                      } else if (typeof followersRaw === "string") {
                                        if (
                                          /followers?|k|m|b/i.test(followersRaw) &&
                                          !/followers?/i.test(followersRaw)
                                        ) {
                                          followersText =
                                            followersRaw + " followers";
                                        } else {
                                          followersText = followersRaw;
                                        }
                                      }
                                    }
                                  } catch {
                                    followersText = "";
                                  }

                                  const mutuals = prospect?.mutualsText || "";

                                  if (followersText && mutuals) {
                                    return (
                                      <span className="text-gray-500">
                                        {followersText}{" "}
                                        <span className="mx-2">•</span>{" "}
                                        <span className="text-gray-400">
                                          {mutuals}
                                        </span>
                                      </span>
                                    );
                                  }

                                  if (followersText)
                                    return (
                                      <span className="text-gray-500">
                                        {followersText}
                                      </span>
                                    );
                                  if (mutuals)
                                    return (
                                      <span className="text-gray-400">
                                        {mutuals}
                                      </span>
                                    );
                                  return null;
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProspect(prospect);
                              handleGenerateMessage(prospect);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                            title="Generate Message"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                          </button>

                          {prospect?.profileUrl && (
                            <a
                              href={prospect.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md flex items-center"
                              title="View LinkedIn Profile"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setSearchResults([]);
                    setSelectedResultUrls([]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                {/* <button
                  onClick={() =>
                    handleSaveProspects(
                      selectedResultUrls.length === 0
                        ? undefined
                        : selectedResultUrls
                    )
                  }
                  disabled={savingResults || searchResults.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingResults
                    ? "Saving..."
                    : selectedResultUrls.length === 0
                    ? "Save All"
                    : "Save Selected"}
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProspectsPage;
