import ollama
import time

def test_chat_with_timing():
    model_name = 'deepseek-v3.1:671b-cloud' # Ensure this matches your installed model
    
    try:
        print(f"Sending request to {model_name}...")
        
        # Start the timer
        start_time = time.perf_counter()
        
        response = ollama.chat(
            model=model_name,
            messages=[{'role': 'user', 'content': 'Say hello, Ollama is running'}],
        )
        
        # End the timer
        end_time = time.perf_counter()
        
        # Calculate duration
        duration = end_time - start_time
        
        print("\n--- Response ---")
        print(response['message']['content'])
        print("-" * 16)
        
        # Display the result rounded to 2 decimal places
        print(f"Status: SUCCESS")
        print(f"Response Time: {duration:.2f} seconds")
        
    except Exception as e:
        print(f"Status: FAILED - {e}")

if __name__ == "__main__":
    test_chat_with_timing()