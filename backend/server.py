from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import yfinance as yf
import pandas as pd
import numpy as np
from scipy.spatial.distance import euclidean
from scipy.stats import pearsonr
from sklearn.preprocessing import MinMaxScaler


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("JWT_SECRET", "bist-analiz-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# BIST 100+ Symbols - Kapsamlı liste (BIST 100, BIST 50 ve popüler hisseler)
BIST_100_SYMBOLS = [
    # Ana BIST 100 Hisseleri
    "AEFES", "AFYON", "AGESA", "AGHOL", "AKBNK", "AKCNS", "AKFGY", "AKFYE", "AKSA", "AKSEN",
    "ALARK", "ALBRK", "ALFAS", "ALGYO", "ALKIM", "ANSGR", "ARCLK", "ARDYZ", "ASELS", "ASUZU",
    "AYDEM", "AYGAZ", "BERA", "BIENY", "BIMAS", "BRSAN", "BRYAT", "BTCIM", "BUCIM", "CANTE",
    "CCOLA", "CEMTS", "CIMSA", "CLEBI", "CONSE", "DEVA", "DOAS", "DOHOL", "ECILC", "EGEEN",
    "EKGYO", "ENJSA", "ENKAI", "ERBOS", "EREGL", "EUPWR", "EUREN", "FROTO", "GARAN", "GENIL",
    "GESAN", "GLYHO", "GOZDE", "GUBRF", "GWIND", "HALKB", "HEKTS", "IPEKE", "ISCTR", "ISGYO",
    "ISMEN", "KARSN", "KCAER", "KCHOL", "KLSER", "KONTR", "KONYA", "KOZAA", "KOZAL", "KRDMD",
    "KRVGD", "KTLEV", "LMKDC", "LOGO", "MAVI", "MERCN", "MGROS", "MIATK", "MKGYO", "ODAS",
    "OTKAR", "OYAKC", "PAPIL", "PETKM", "PGSUS", "QUAGR", "SAHOL", "SASA", "SELEC", "SISE",
    "SKBNK", "SMRTG", "SOKM", "TAVHL", "TCELL", "THYAO", "TKFEN", "TKNSA", "TOASO", "TRGYO",
    "TSKB", "TTKOM", "TTRAK", "TUPRS", "TURSG", "ULKER", "VAKBN", "VERUS", "VESTL", "YKBNK",
    # Ek BIST Hisseleri
    "TGSAS", "DESPC", "KLRHO", "GSRAY", "FENER", "BJKAS", "TSPOR", "NETAS", "INDES", "ARENA",
    "ADESE", "ADEL", "AKENR", "ALCAR", "ALMAD", "ANELE", "ANHYT", "ANSEN", "ARASE", "ARMDA",
    "ASTOR", "ATAGY", "ATLAS", "AVHOL", "AVOD", "AVTUR", "AYCES", "BAGFS", "BAKAB", "BANVT",
    "BARMA", "BASGZ", "BAYRK", "BEYAZ", "BFREN", "BIGCH", "BIZIM", "BLCYT", "BMSCH", "BMSTL",
    "BNTAS", "BOBET", "BOSSA", "BRISA", "BRKSN", "BRLSM", "BRMEN", "BURCE", "BURVA", "CASA",
    "CEMAS", "CMENT", "CUSAN", "CVKMD", "DAGHL", "DAGI", "DAPGM", "DARDL", "DENGE", "DERHL",
    "DERIM", "DESA", "DGATE", "DGGYO", "DGNMO", "DIRIT", "DITAS", "DJIST", "DMRGD", "DNISI",
    "DOBUR", "DOCO", "DOGUB", "DOKTA", "DURDO", "DYOBY", "DZGYO", "EBEBK", "EDIP", "EGEPO",
    "EGGUB", "EGPRO", "EGSER", "EKIZ", "EKSUN", "ELITE", "EMKEL", "EMNIS", "ENSRI", "EPLAS",
    "ERSU", "ESCAR", "ESCOM", "ESEN", "ETILR", "ETYAT", "EUHOL", "EUYO", "EYGYO", "FADE",
    "FMIZP", "FONET", "FORMT", "FORTE", "FRIGO", "GEDIK", "GEDZA", "GENTS", "GLBMD", "GLCVY",
    "GLRYH", "GMTAS", "GOKNR", "GOLTS", "GOODY", "GRNYO", "GRSEL", "GRTRK", "GSDDE", "GSDHO",
    "GSRAY", "GZNMI", "HATEK", "HATSN", "HDFGS", "HEDEF", "HKTM", "HLGYO", "HTTBT", "HUBVC",
    "HUNER", "HURGZ", "ICBCT", "ICUGS", "IDEAS", "IDGYO", "IEYHO", "IHEVA", "IHGZT", "IHLAS",
    "IHLGM", "IHYAY", "IMASM", "INGRM", "INTEM", "INVEO", "INVES", "ISATR", "ISBIR", "ISBTR",
    "ISFIN", "ISGSY", "ISKPL", "ISKUR", "ISSEN", "IZFAS", "IZINV", "IZMDC", "JANTS", "KAPLM",
    "KAREL", "KARTN", "KARYE", "KATMR", "KAYSE", "KBORU", "KERVN", "KFEIN", "KGYO", "KIMMR",
    "KLGYO", "KLKIM", "KLMSN", "KLNMA", "KMPUR", "KNFRT", "KONKA", "KOPOL", "KORDS", "KRPLS",
    "KRSTL", "KRTEK", "KRVTN", "KUTPO", "KUYAS", "KZBGY", "KZGYO", "LIDER", "LIDFA", "LILAK",
    "LINK", "LKMNH", "LUKSK", "MAALT", "MACKO", "MAGEN", "MAKIM", "MAKTK", "MANAS", "MARBL",
    "MARKA", "MARTI", "MAVI", "MEDTR", "MEGAP", "MEKAG", "MEPET", "MERIT", "MERKO", "METRO",
    "METUR", "MHRGY", "MIPAZ", "MMCAS", "MNDRS", "MNDTR", "MOBTL", "MOGAN", "MPARK", "MRGYO",
    "MRSHL", "MSGYO", "MTRKS", "MTRYO", "MZHLD", "NATEN", "NIBAS", "NTGAZ", "NUGYO", "NUHCM",
    "OBAMS", "OBASE", "ONCSM", "ORCAY", "ORGE", "ORMA", "OSMEN", "OSTIM", "OYLUM", "OZGYO",
    "OZKGY", "OZRDN", "OZSUB", "PAGYO", "PAMEL", "PNLSN", "PNSUT", "POLHO", "POLTK", "PRDGS",
    "PRKAB", "PRKME", "PRZMA", "PSDTC", "QNBFB", "QNBFL", "RALYH", "RAYSG", "REEDR", "RGYAS",
    "RODRG", "ROYAL", "RTALB", "RUBNS", "RYSAS", "SAFKR", "SAMAT", "SANEL", "SANFM", "SANKO",
    "SARKY", "SAYAS", "SDTTR", "SEGYO", "SEKFK", "SEKUR", "SELGD", "SELVA", "SEYKM", "SILVR",
    "SNGYO", "SNICA", "SNKRN", "SNPAM", "SODSN", "SONME", "SURGY", "SUWEN", "TARKM", "TATGD",
    "TBORG", "TDGYO", "TEKTU", "TERA", "TETMT", "TEZOL", "TKNSA", "TLMAN", "TMPOL", "TMSN",
    "TNZTP", "TOASO", "TRCAS", "TRILC", "TSGYO", "TSPOR", "TUCLK", "TUKAS", "TUREX", "ULUUN",
    "UMPAS", "UNLU", "USDTR", "USAS", "UZERB", "VAKFN", "VAKKO", "VANGD", "VBTYZ", "VERTU",
    "VKFYO", "VKGYO", "VKING", "YAPRK", "YATAS", "YAYLA", "YGGYO", "YGYO", "YKSLN", "YUNSA",
    "YYAPI", "ZEDUR", "ZOREN", "ZRGYO"
]

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class StockAnalysisRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str

class SimilaritySearchRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    min_similarity: float = 0.7
    limit: int = 10

class PatternCriteria(BaseModel):
    """Her dip/tepe noktası için özelleştirilebilir kriterler"""
    # 1. Dip -> 1. Tepe yükseliş
    rise_1_min: float = 100
    rise_1_max: float = 160
    # 1. Tepe -> 2. Dip düşüş
    drop_1_min: float = 40
    drop_1_max: float = 60
    # 2. Dip -> 2. Tepe yükseliş (1. tepeyi geçmeli)
    rise_2_min: float = 20
    rise_2_max: float = 50
    # 2. Tepe -> 3. Dip düşüş
    drop_2_min: float = 20
    drop_2_max: float = 30
    # 3. Dip -> 3. Tepe yükseliş (2. tepeyi geçmeli)
    rise_3_min: float = 15
    rise_3_max: float = 40
    # 3. Tepe -> 4. Dip düşüş
    drop_3_min: float = 15
    drop_3_max: float = 30
    # 4. Dip -> 4. Tepe yükseliş
    rise_4_min: float = 10
    rise_4_max: float = 30
    # 4. Tepe -> 5. Dip düşüş
    drop_4_min: float = 10
    drop_4_max: float = 25
    # 5. Dip -> 5. Tepe yükseliş
    rise_5_min: float = 5
    rise_5_max: float = 20
    # 5. Tepe -> 6. Dip düşüş
    drop_5_min: float = 10
    drop_5_max: float = 40

class AdvancedPatternRequest(BaseModel):
    """Gelişmiş kalıp arama - kullanıcı tanımlı kriterler"""
    criteria: PatternCriteria
    start_date: str
    end_date: str
    min_points_match: int = 4  # En az kaç nokta eşleşmeli
    limit: int = 20

class CustomPatternRequest(BaseModel):
    pattern_criteria: Dict[str, Any]
    start_date: str
    end_date: str
    limit: int = 10

class PeakTroughPoint(BaseModel):
    point_type: str  # "dip" or "tepe"
    point_number: int
    date: str
    price: float
    percentage_change: Optional[float] = None

class StockAnalysisResponse(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    prices: List[Dict[str, Any]]
    peaks_troughs: List[PeakTroughPoint]
    summary: Dict[str, Any]

class SimilarStockResult(BaseModel):
    symbol: str
    similarity_score: float
    correlation: float
    start_date: str
    end_date: str
    peaks_troughs: List[PeakTroughPoint]
    current_price: float
    price_change_percent: float
    match_type: str = "full"  # "full" or "partial"
    pattern_progress: Optional[float] = None  # % of pattern completed
    # Kalıptan sonra ne oldu bilgisi
    after_pattern_1m: Optional[float] = None  # 1 ay sonraki değişim %
    after_pattern_3m: Optional[float] = None  # 3 ay sonraki değişim %
    pattern_end_price: Optional[float] = None  # Kalıp sonundaki fiyat

class PartialMatchRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    min_similarity: float = 0.6
    pattern_start_percent: float = 30  # İlk yüzde kaçını karşılaştır
    limit: int = 15

class PatternPoint(BaseModel):
    time: int
    price: float
    type: str  # 'dip' or 'tepe'

class SearchByPatternRequest(BaseModel):
    symbol: str
    points: List[PatternPoint]
    criteria: Optional[dict] = None
    min_similarity: float = 0.6
    limit: int = 20

# Helper Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_stock_data(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch stock data from Yahoo Finance"""
    ticker = f"{symbol}.IS"  # BIST stocks use .IS suffix
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(start=start_date, end=end_date)
        if df.empty:
            logger.warning(f"No data for {ticker}")
            return pd.DataFrame()
        df = df.reset_index()
        df['Date'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
        return df
    except Exception as e:
        logger.error(f"Error fetching {ticker}: {e}")
        return pd.DataFrame()

def normalize_prices(prices: np.ndarray) -> np.ndarray:
    """Normalize prices to 0-1 range"""
    if len(prices) == 0:
        return prices
    scaler = MinMaxScaler()
    return scaler.fit_transform(prices.reshape(-1, 1)).flatten()

def calculate_similarity(prices1: np.ndarray, prices2: np.ndarray) -> tuple:
    """Calculate similarity between two price series"""
    if len(prices1) == 0 or len(prices2) == 0:
        return 0.0, 0.0
    
    # Normalize both series
    norm1 = normalize_prices(prices1)
    norm2 = normalize_prices(prices2)
    
    # Resample to same length if needed
    if len(norm1) != len(norm2):
        min_len = min(len(norm1), len(norm2))
        indices1 = np.linspace(0, len(norm1)-1, min_len).astype(int)
        indices2 = np.linspace(0, len(norm2)-1, min_len).astype(int)
        norm1 = norm1[indices1]
        norm2 = norm2[indices2]
    
    # Calculate Euclidean distance (lower is more similar)
    distance = euclidean(norm1, norm2)
    # Convert to similarity (0-1 scale)
    max_distance = np.sqrt(len(norm1))  # Max possible distance for normalized data
    similarity = max(0, 1 - (distance / max_distance))
    
    # Calculate correlation
    try:
        correlation, _ = pearsonr(norm1, norm2)
        if np.isnan(correlation):
            correlation = 0.0
    except:
        correlation = 0.0
    
    return similarity, correlation


def find_best_matching_window(ref_prices: np.ndarray, target_prices: np.ndarray, target_dates: list) -> dict:
    """
    Sliding window ile hedef hissenin tüm geçmişinde referans kalıba en benzer dönemi bul.
    
    ref_prices: Referans kalıbın fiyatları
    target_prices: Hedef hissenin TÜM geçmiş fiyatları
    target_dates: Hedef hissenin tarihleri
    
    Returns: {
        'similarity': float,
        'correlation': float,
        'start_idx': int,
        'end_idx': int,
        'start_date': str,
        'end_date': str,
        'prices': np.ndarray,
        'after_1m_change': float or None,
        'after_3m_change': float or None
    }
    """
    if len(ref_prices) < 10 or len(target_prices) < len(ref_prices):
        return None
    
    window_size = len(ref_prices)
    best_match = {
        'similarity': 0,
        'correlation': 0,
        'start_idx': 0,
        'end_idx': window_size,
        'start_date': '',
        'end_date': '',
        'prices': None,
        'after_1m_change': None,
        'after_3m_change': None,
        'pattern_end_price': None
    }
    
    # Normalize reference pattern once
    ref_norm = normalize_prices(ref_prices)
    
    # Slide window across target history
    # Step size: her 5 günde bir kontrol et (performans için)
    step_size = max(1, window_size // 10)
    
    for start_idx in range(0, len(target_prices) - window_size + 1, step_size):
        end_idx = start_idx + window_size
        window_prices = target_prices[start_idx:end_idx]
        
        # Normalize window
        window_norm = normalize_prices(window_prices)
        
        # Calculate similarity
        distance = euclidean(ref_norm, window_norm)
        max_distance = np.sqrt(len(ref_norm))
        similarity = max(0, 1 - (distance / max_distance))
        
        if similarity > best_match['similarity']:
            # Calculate correlation
            try:
                correlation, _ = pearsonr(ref_norm, window_norm)
                if np.isnan(correlation):
                    correlation = 0.0
            except:
                correlation = 0.0
            
            # Kalıptan sonraki performansı hesapla
            after_1m_change = None
            after_3m_change = None
            pattern_end_price = window_prices[-1]
            
            # 1 ay sonra (~22 işlem günü)
            after_1m_idx = end_idx + 22
            if after_1m_idx < len(target_prices):
                after_1m_price = target_prices[after_1m_idx]
                after_1m_change = round((after_1m_price - pattern_end_price) / pattern_end_price * 100, 2)
            
            # 3 ay sonra (~66 işlem günü)
            after_3m_idx = end_idx + 66
            if after_3m_idx < len(target_prices):
                after_3m_price = target_prices[after_3m_idx]
                after_3m_change = round((after_3m_price - pattern_end_price) / pattern_end_price * 100, 2)
            
            best_match = {
                'similarity': similarity,
                'correlation': correlation,
                'start_idx': start_idx,
                'end_idx': end_idx,
                'start_date': target_dates[start_idx] if start_idx < len(target_dates) else '',
                'end_date': target_dates[end_idx - 1] if end_idx - 1 < len(target_dates) else '',
                'prices': window_prices,
                'after_1m_change': after_1m_change,
                'after_3m_change': after_3m_change,
                'pattern_end_price': round(pattern_end_price, 2)
            }
    
    return best_match if best_match['similarity'] > 0 else None


def calculate_partial_similarity(ref_prices: np.ndarray, target_prices: np.ndarray, start_percent: float = 30) -> tuple:
    """
    Kalıbın başlangıç kısmını karşılaştır - devam eden kalıpları bulmak için.
    ref_prices: Referans hissenin tam kalıbı
    target_prices: Karşılaştırılacak hissenin mevcut fiyatları
    start_percent: Referans kalıbın ilk yüzde kaçı karşılaştırılacak
    """
    if len(ref_prices) < 10 or len(target_prices) < 10:
        return 0.0, 0.0, 0.0
    
    # Referans kalıbın başlangıç kısmını al
    ref_start_len = max(10, int(len(ref_prices) * start_percent / 100))
    ref_start = ref_prices[:ref_start_len]
    
    # Target'ın son kısmını al (mevcut durumu)
    target_recent = target_prices[-ref_start_len:] if len(target_prices) >= ref_start_len else target_prices
    
    # Normalize
    ref_norm = normalize_prices(ref_start)
    target_norm = normalize_prices(target_recent)
    
    # Aynı uzunluğa getir
    min_len = min(len(ref_norm), len(target_norm))
    if min_len < 5:
        return 0.0, 0.0, 0.0
    
    indices1 = np.linspace(0, len(ref_norm)-1, min_len).astype(int)
    indices2 = np.linspace(0, len(target_norm)-1, min_len).astype(int)
    ref_norm = ref_norm[indices1]
    target_norm = target_norm[indices2]
    
    # Benzerlik hesapla
    distance = euclidean(ref_norm, target_norm)
    max_distance = np.sqrt(len(ref_norm))
    similarity = max(0, 1 - (distance / max_distance))
    
    # Korelasyon
    try:
        correlation, _ = pearsonr(ref_norm, target_norm)
        if np.isnan(correlation):
            correlation = 0.0
    except:
        correlation = 0.0
    
    # Kalıp ilerleme yüzdesi (target ne kadarını tamamlamış)
    pattern_progress = (len(target_recent) / len(ref_prices)) * 100
    
    return similarity, correlation, pattern_progress

def find_peaks_troughs(prices: np.ndarray, dates: List[str]) -> List[PeakTroughPoint]:
    """
    Find peaks and troughs based on the specified criteria:
    - 1st dip: Starting point before 100% rise
    - 1st peak: 100-160% rise from 1st dip, followed by 40-60% drop
    - 2nd dip: After 40-60% drop from 1st peak
    - 2nd peak: Exceeds 1st peak, then drops 20-30%
    - And so on...
    """
    if len(prices) < 10:
        return []
    
    points = []
    window = 5
    
    # Find local minima and maxima
    local_mins = []
    local_maxs = []
    
    for i in range(window, len(prices) - window):
        is_min = all(prices[i] <= prices[i-j] for j in range(1, window+1)) and \
                 all(prices[i] <= prices[i+j] for j in range(1, window+1))
        is_max = all(prices[i] >= prices[i-j] for j in range(1, window+1)) and \
                 all(prices[i] >= prices[i+j] for j in range(1, window+1))
        
        if is_min:
            local_mins.append((i, prices[i], dates[i]))
        if is_max:
            local_maxs.append((i, prices[i], dates[i]))
    
    # Identify significant peaks and troughs
    dip_count = 0
    peak_count = 0
    last_dip = None
    last_peak = None
    
    all_points = sorted(local_mins + local_maxs, key=lambda x: x[0])
    
    for idx, price, date in all_points:
        is_dip = (idx, price, date) in local_mins
        
        if is_dip:
            if last_peak is not None:
                drop_pct = ((last_peak[1] - price) / last_peak[1]) * 100
                
                # Check criteria for each dip
                if dip_count == 0 and drop_pct >= 40:
                    dip_count += 1
                    points.append(PeakTroughPoint(
                        point_type="dip",
                        point_number=dip_count,
                        date=date,
                        price=round(price, 2),
                        percentage_change=round(-drop_pct, 2)
                    ))
                    last_dip = (idx, price, date)
                elif dip_count >= 1 and last_peak is not None:
                    if (dip_count == 1 and 40 <= drop_pct <= 60) or \
                       (dip_count == 2 and 20 <= drop_pct <= 30) or \
                       (dip_count >= 3 and 15 <= drop_pct <= 40):
                        dip_count += 1
                        points.append(PeakTroughPoint(
                            point_type="dip",
                            point_number=dip_count,
                            date=date,
                            price=round(price, 2),
                            percentage_change=round(-drop_pct, 2)
                        ))
                        last_dip = (idx, price, date)
            elif last_dip is None:
                # First point - potential starting dip
                dip_count += 1
                points.append(PeakTroughPoint(
                    point_type="dip",
                    point_number=dip_count,
                    date=date,
                    price=round(price, 2),
                    percentage_change=None
                ))
                last_dip = (idx, price, date)
        else:
            # It's a peak
            if last_dip is not None:
                rise_pct = ((price - last_dip[1]) / last_dip[1]) * 100
                
                # Check criteria for each peak
                if peak_count == 0 and 100 <= rise_pct <= 160:
                    peak_count += 1
                    points.append(PeakTroughPoint(
                        point_type="tepe",
                        point_number=peak_count,
                        date=date,
                        price=round(price, 2),
                        percentage_change=round(rise_pct, 2)
                    ))
                    last_peak = (idx, price, date)
                elif peak_count >= 1:
                    if last_peak is not None and price > last_peak[1]:
                        peak_count += 1
                        points.append(PeakTroughPoint(
                            point_type="tepe",
                            point_number=peak_count,
                            date=date,
                            price=round(price, 2),
                            percentage_change=round(rise_pct, 2)
                        ))
                        last_peak = (idx, price, date)
    
    return points[:12]  # Limit to 12 points max


def find_peaks_troughs_with_criteria(prices: np.ndarray, dates: List[str], criteria: PatternCriteria) -> List[PeakTroughPoint]:
    """
    Kullanıcının belirlediği kriterlere göre dip ve tepe noktalarını bul.
    """
    if len(prices) < 10:
        return []
    
    points = []
    window = 5
    
    # Find local minima and maxima
    local_mins = []
    local_maxs = []
    
    for i in range(window, len(prices) - window):
        is_min = all(prices[i] <= prices[i-j] for j in range(1, window+1)) and \
                 all(prices[i] <= prices[i+j] for j in range(1, window+1))
        is_max = all(prices[i] >= prices[i-j] for j in range(1, window+1)) and \
                 all(prices[i] >= prices[i+j] for j in range(1, window+1))
        
        if is_min:
            local_mins.append((i, prices[i], dates[i]))
        if is_max:
            local_maxs.append((i, prices[i], dates[i]))
    
    # Kriterler listesi
    rise_criteria = [
        (criteria.rise_1_min, criteria.rise_1_max),
        (criteria.rise_2_min, criteria.rise_2_max),
        (criteria.rise_3_min, criteria.rise_3_max),
        (criteria.rise_4_min, criteria.rise_4_max),
        (criteria.rise_5_min, criteria.rise_5_max),
    ]
    
    drop_criteria = [
        (criteria.drop_1_min, criteria.drop_1_max),
        (criteria.drop_2_min, criteria.drop_2_max),
        (criteria.drop_3_min, criteria.drop_3_max),
        (criteria.drop_4_min, criteria.drop_4_max),
        (criteria.drop_5_min, criteria.drop_5_max),
    ]
    
    dip_count = 0
    peak_count = 0
    last_dip = None
    last_peak = None
    
    all_points = sorted(local_mins + local_maxs, key=lambda x: x[0])
    
    for idx, price, date in all_points:
        is_dip = (idx, price, date) in local_mins
        
        if is_dip:
            if last_peak is not None and dip_count < 6:
                drop_pct = ((last_peak[1] - price) / last_peak[1]) * 100
                
                # Hangi düşüş kriterini kontrol edeceğiz
                criterion_idx = min(dip_count, len(drop_criteria) - 1)
                min_drop, max_drop = drop_criteria[criterion_idx]
                
                if min_drop <= drop_pct <= max_drop:
                    dip_count += 1
                    points.append(PeakTroughPoint(
                        point_type="dip",
                        point_number=dip_count,
                        date=date,
                        price=round(price, 2),
                        percentage_change=round(-drop_pct, 2)
                    ))
                    last_dip = (idx, price, date)
            elif last_dip is None and dip_count == 0:
                # İlk dip noktası
                dip_count += 1
                points.append(PeakTroughPoint(
                    point_type="dip",
                    point_number=dip_count,
                    date=date,
                    price=round(price, 2),
                    percentage_change=None
                ))
                last_dip = (idx, price, date)
        else:
            # Tepe noktası
            if last_dip is not None and peak_count < 5:
                rise_pct = ((price - last_dip[1]) / last_dip[1]) * 100
                
                # Hangi yükseliş kriterini kontrol edeceğiz
                criterion_idx = min(peak_count, len(rise_criteria) - 1)
                min_rise, max_rise = rise_criteria[criterion_idx]
                
                if min_rise <= rise_pct <= max_rise:
                    # 2. tepe ve sonrası için önceki tepeyi geçmeli
                    if peak_count == 0 or (last_peak is not None and price > last_peak[1]):
                        peak_count += 1
                        points.append(PeakTroughPoint(
                            point_type="tepe",
                            point_number=peak_count,
                            date=date,
                            price=round(price, 2),
                            percentage_change=round(rise_pct, 2)
                        ))
                        last_peak = (idx, price, date)
    
    return points

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "password_hash": get_password_hash(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": user["id"]})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"]
    )

# Stock Routes
@api_router.get("/stocks/symbols")
async def get_symbols(current_user: dict = Depends(get_current_user)):
    """Get list of BIST symbols - alfabetik sıralı"""
    sorted_symbols = sorted(BIST_100_SYMBOLS)
    return {"symbols": sorted_symbols}

@api_router.get("/stocks/{symbol}/candlestick")
async def get_candlestick_data(
    symbol: str, 
    interval: str = "1d",
    period: str = "2y",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get candlestick (OHLC) data for charting.
    interval: 1h, 4h, 1d, 1wk, 1mo
    period: 1mo, 3mo, 6mo, 1y, 2y, 5y (used if start_date/end_date not provided)
    start_date, end_date: Optional date range (format: YYYY-MM-DD)
    """
    ticker = f"{symbol}.IS"
    try:
        stock = yf.Ticker(ticker)
        
        # Yahoo Finance interval mapping
        valid_intervals = ["1h", "4h", "1d", "1wk", "1mo"]
        if interval not in valid_intervals:
            interval = "1d"
        
        # Use date range if provided, otherwise use period
        if start_date and end_date:
            df = stock.history(start=start_date, end=end_date, interval=interval)
        else:
            # For intraday data, period must be limited
            if interval in ["1h", "4h"]:
                period = "60d"  # Max 60 days for hourly data
            df = stock.history(period=period, interval=interval)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data for {symbol}")
        
        df = df.reset_index()
        
        candles = []
        for _, row in df.iterrows():
            # Handle datetime for different intervals
            if 'Datetime' in df.columns:
                timestamp = int(row['Datetime'].timestamp())
            else:
                timestamp = int(row['Date'].timestamp())
            
            candles.append({
                "time": timestamp,
                "open": round(float(row['Open']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "close": round(float(row['Close']), 2),
                "volume": int(row['Volume']) if pd.notna(row['Volume']) else 0
            })
        
        return {
            "symbol": symbol,
            "interval": interval,
            "period": period,
            "candles": candles
        }
    except Exception as e:
        logger.error(f"Error getting candlestick data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/stocks/analyze", response_model=StockAnalysisResponse)
async def analyze_stock(request: StockAnalysisRequest, current_user: dict = Depends(get_current_user)):
    """Analyze a single stock"""
    df = get_stock_data(request.symbol, request.start_date, request.end_date)
    
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {request.symbol}")
    
    prices = df['Close'].values
    dates = df['Date'].tolist()
    
    peaks_troughs = find_peaks_troughs(prices, dates)
    
    # Create price history
    price_history = []
    for i, row in df.iterrows():
        price_history.append({
            "date": row['Date'],
            "open": round(row['Open'], 2),
            "high": round(row['High'], 2),
            "low": round(row['Low'], 2),
            "close": round(row['Close'], 2),
            "volume": int(row['Volume']) if pd.notna(row['Volume']) else 0
        })
    
    # Calculate summary
    summary = {
        "min_price": round(prices.min(), 2),
        "max_price": round(prices.max(), 2),
        "avg_price": round(prices.mean(), 2),
        "volatility": round(prices.std() / prices.mean() * 100, 2),
        "total_return": round((prices[-1] - prices[0]) / prices[0] * 100, 2),
        "data_points": len(prices)
    }
    
    return StockAnalysisResponse(
        symbol=request.symbol,
        start_date=request.start_date,
        end_date=request.end_date,
        prices=price_history,
        peaks_troughs=peaks_troughs,
        summary=summary
    )

@api_router.post("/stocks/find-similar", response_model=List[SimilarStockResult])
async def find_similar_stocks(request: SimilaritySearchRequest, current_user: dict = Depends(get_current_user)):
    """
    Find stocks with similar price patterns using sliding window approach.
    Searches through the ENTIRE history of each stock to find when a similar pattern occurred.
    Also calculates what happened AFTER the pattern completed.
    """
    # Get reference stock data
    ref_df = get_stock_data(request.symbol, request.start_date, request.end_date)
    
    if ref_df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {request.symbol}")
    
    ref_prices = ref_df['Close'].values
    ref_pattern_length = len(ref_prices)
    results = []
    
    # Her hisse için son 7 yıllık veriyi tara
    from datetime import datetime, timedelta
    history_end = datetime.now().strftime('%Y-%m-%d')
    history_start = (datetime.now() - timedelta(days=7*365)).strftime('%Y-%m-%d')  # 7 yıl geriye
    
    logger.info(f"Searching for patterns similar to {request.symbol} ({ref_pattern_length} days) in history from {history_start} to {history_end}")
    
    # Performans için hisse sayısını sınırla
    stocks_to_check = BIST_100_SYMBOLS[:200]  # İlk 200 hisse
    
    for symbol in stocks_to_check:
        if symbol == request.symbol:
            continue
        
        try:
            # Hissenin TÜM geçmiş verisini al
            df = get_stock_data(symbol, history_start, history_end)
            if df.empty or len(df) < ref_pattern_length + 66:  # En az kalıp + 3 ay sonrası kadar veri olmalı
                continue
            
            all_prices = df['Close'].values
            all_dates = df['Date'].tolist()
            
            # Sliding window ile en benzer dönemi bul
            best_match = find_best_matching_window(ref_prices, all_prices, all_dates)
            
            if best_match and best_match['similarity'] >= request.min_similarity:
                # O dönemdeki dip/tepe noktalarını bul
                window_prices = best_match['prices']
                window_start_idx = best_match['start_idx']
                window_end_idx = best_match['end_idx']
                window_dates = all_dates[window_start_idx:window_end_idx]
                
                peaks_troughs = find_peaks_troughs(window_prices, window_dates)
                
                # Güncel fiyat
                current_price = all_prices[-1]
                
                results.append(SimilarStockResult(
                    symbol=symbol,
                    similarity_score=round(best_match['similarity'] * 100, 2),
                    correlation=round(best_match['correlation'] * 100, 2),
                    start_date=best_match['start_date'],
                    end_date=best_match['end_date'],
                    peaks_troughs=peaks_troughs,
                    current_price=round(current_price, 2),
                    price_change_percent=round((window_prices[-1] - window_prices[0]) / window_prices[0] * 100, 2),
                    after_pattern_1m=best_match['after_1m_change'],
                    after_pattern_3m=best_match['after_3m_change'],
                    pattern_end_price=best_match['pattern_end_price']
                ))
        except Exception as e:
            logger.warning(f"Error processing {symbol}: {e}")
            continue
    
    # Sort by similarity score
    results.sort(key=lambda x: x.similarity_score, reverse=True)
    
    logger.info(f"Found {len(results)} similar patterns")
    
    return results[:request.limit]


@api_router.post("/stocks/find-partial-match", response_model=List[SimilarStockResult])
async def find_partial_match_stocks(request: PartialMatchRequest, current_user: dict = Depends(get_current_user)):
    """
    Kalıbın başlangıcı benzeyen ama henüz tamamlanmamış hisseleri bul.
    Bu, referans hissenin kalıbının ilk kısmına benzeyen hisseleri bulur.
    """
    # Get reference stock data
    ref_df = get_stock_data(request.symbol, request.start_date, request.end_date)
    
    if ref_df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {request.symbol}")
    
    ref_prices = ref_df['Close'].values
    results = []
    
    # Son 6 ay için tarih hesapla
    from datetime import datetime, timedelta
    end_date_obj = datetime.strptime(request.end_date, '%Y-%m-%d')
    recent_start = (end_date_obj - timedelta(days=180)).strftime('%Y-%m-%d')
    
    # Performans için sadece ana BIST 100 hisselerini kontrol et
    main_stocks = BIST_100_SYMBOLS[:150]  # İlk 150 hisse (en likid olanlar)
    
    # Compare with main BIST stocks for performance
    for symbol in main_stocks:
        if symbol == request.symbol:
            continue
        
        try:
            # Son 6 aylık veriyi al (devam eden kalıp için)
            df = get_stock_data(symbol, recent_start, request.end_date)
            if df.empty or len(df) < 20:
                continue
            
            prices = df['Close'].values
            dates = df['Date'].tolist()
            
            # Kısmi benzerlik hesapla
            similarity, correlation, pattern_progress = calculate_partial_similarity(
                ref_prices, prices, request.pattern_start_percent
            )
            
            if similarity >= request.min_similarity:
                peaks_troughs = find_peaks_troughs(prices, dates)
                
                results.append(SimilarStockResult(
                    symbol=symbol,
                    similarity_score=round(similarity * 100, 2),
                    correlation=round(correlation * 100, 2),
                    start_date=recent_start,
                    end_date=request.end_date,
                    peaks_troughs=peaks_troughs,
                    current_price=round(prices[-1], 2),
                    price_change_percent=round((prices[-1] - prices[0]) / prices[0] * 100, 2),
                    match_type="partial",
                    pattern_progress=round(pattern_progress, 1)
                ))
        except Exception as e:
            logger.warning(f"Error processing {symbol}: {e}")
            continue
    
    # Sort by similarity score
    results.sort(key=lambda x: x.similarity_score, reverse=True)
    
    return results[:request.limit]

@api_router.post("/stocks/custom-pattern")
async def find_custom_pattern(request: CustomPatternRequest, current_user: dict = Depends(get_current_user)):
    """Find stocks matching custom pattern criteria"""
    criteria = request.pattern_criteria
    results = []
    
    # Extract criteria
    min_rise_1 = criteria.get("min_rise_1", 100)  # First rise %
    max_rise_1 = criteria.get("max_rise_1", 160)
    min_drop_1 = criteria.get("min_drop_1", 40)   # First drop %
    max_drop_1 = criteria.get("max_drop_1", 60)
    min_rise_2 = criteria.get("min_rise_2", 20)   # Second rise %
    
    for symbol in BIST_100_SYMBOLS:
        try:
            df = get_stock_data(symbol, request.start_date, request.end_date)
            if df.empty or len(df) < 20:
                continue
            
            prices = df['Close'].values
            dates = df['Date'].tolist()
            
            # Find patterns matching criteria
            peaks_troughs = find_peaks_troughs(prices, dates)
            
            # Check if pattern matches criteria
            matching_points = []
            for pt in peaks_troughs:
                if pt.percentage_change is not None:
                    change = abs(pt.percentage_change)
                    if pt.point_type == "tepe" and pt.point_number == 1:
                        if min_rise_1 <= change <= max_rise_1:
                            matching_points.append(pt)
                    elif pt.point_type == "dip" and pt.point_number == 2:
                        if min_drop_1 <= change <= max_drop_1:
                            matching_points.append(pt)
            
            if len(matching_points) >= 2:
                results.append({
                    "symbol": symbol,
                    "peaks_troughs": [p.model_dump() for p in peaks_troughs],
                    "current_price": round(prices[-1], 2),
                    "price_change_percent": round((prices[-1] - prices[0]) / prices[0] * 100, 2),
                    "matching_criteria_count": len(matching_points)
                })
        except Exception as e:
            logger.warning(f"Error processing {symbol}: {e}")
            continue
    
    # Sort by matching criteria count
    results.sort(key=lambda x: x["matching_criteria_count"], reverse=True)
    
    return results[:request.limit]

@api_router.post("/stocks/advanced-pattern")
async def find_advanced_pattern(request: AdvancedPatternRequest, current_user: dict = Depends(get_current_user)):
    """
    Gelişmiş kalıp arama - kullanıcının belirlediği 6 dip / 5 tepe kriterleriyle arama yapar.
    Her yükseliş ve düşüş için ayrı min/max değerleri kullanılır.
    """
    results = []
    criteria = request.criteria
    
    # Performans için ilk 200 hisseyi kontrol et
    stocks_to_check = sorted(BIST_100_SYMBOLS)[:200]
    
    for symbol in stocks_to_check:
        try:
            df = get_stock_data(symbol, request.start_date, request.end_date)
            if df.empty or len(df) < 30:
                continue
            
            prices = df['Close'].values
            dates = df['Date'].tolist()
            
            # Kullanıcı kriterlerine göre dip/tepe bul
            peaks_troughs = find_peaks_troughs_with_criteria(prices, dates, criteria)
            
            # En az belirtilen sayıda nokta eşleşmeli
            if len(peaks_troughs) >= request.min_points_match:
                # Eşleşme skoru hesapla (bulunan nokta sayısı / maksimum nokta sayısı)
                match_score = (len(peaks_troughs) / 11) * 100  # 6 dip + 5 tepe = 11
                
                results.append({
                    "symbol": symbol,
                    "peaks_troughs": [p.model_dump() for p in peaks_troughs],
                    "current_price": round(prices[-1], 2),
                    "price_change_percent": round((prices[-1] - prices[0]) / prices[0] * 100, 2),
                    "matching_points_count": len(peaks_troughs),
                    "match_score": round(match_score, 1),
                    "dip_count": len([p for p in peaks_troughs if p.point_type == "dip"]),
                    "peak_count": len([p for p in peaks_troughs if p.point_type == "tepe"])
                })
        except Exception as e:
            logger.warning(f"Error processing {symbol}: {e}")
            continue
    
    # Eşleşme skoruna göre sırala
    results.sort(key=lambda x: x["match_score"], reverse=True)
    
    return results[:request.limit]

@api_router.get("/stocks/{symbol}/quick")
async def get_stock_quick(symbol: str, current_user: dict = Depends(get_current_user)):
    """Get quick stock info"""
    ticker = f"{symbol}.IS"
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="5d")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data for {symbol}")
        
        current_price = hist['Close'].iloc[-1]
        prev_price = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
        change_pct = ((current_price - prev_price) / prev_price) * 100
        
        return {
            "symbol": symbol,
            "name": info.get("shortName", symbol),
            "current_price": round(current_price, 2),
            "change_percent": round(change_pct, 2),
            "volume": int(hist['Volume'].iloc[-1]) if pd.notna(hist['Volume'].iloc[-1]) else 0,
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector", "N/A")
        }
    except Exception as e:
        logger.error(f"Error getting quick data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Save analysis
@api_router.post("/analysis/save")
async def save_analysis(analysis_data: dict, current_user: dict = Depends(get_current_user)):
    """Save user analysis"""
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "data": analysis_data,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.saved_analyses.insert_one(doc)
    return {"id": doc["id"], "message": "Analysis saved"}

@api_router.get("/analysis/saved")
async def get_saved_analyses(current_user: dict = Depends(get_current_user)):
    """Get user's saved analyses"""
    analyses = await db.saved_analyses.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return analyses

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
